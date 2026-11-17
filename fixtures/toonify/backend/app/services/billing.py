from datetime import datetime
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException
from app.models.models import Workspace, CreditTransaction
from app.core.errors import AppException, ErrorCode

class BillingService:
    # Pricing Matrix (Cost per action)
    # Tiers: free, plus ($12/mo), pro ($39/mo), studio ($119/mo)
    PRICING = {
        # Project & Worldview
        "augment_worldview": {"free": 5, "plus": 5, "pro": 5, "studio": 5},
        "generate_project_cover_image": {"free": 15, "plus": 15, "pro": 15, "studio": 15},
        
        # Art Style
        "recommend_style": {"free": 1, "plus": 1, "pro": 1, "studio": 1},
        "style_sample_generation": {"free": 10, "plus": 10, "pro": 10, "studio": 10},
        
        # Character
        "augment_character_text": {"free": 5, "plus": 5, "pro": 5, "studio": 5},
        "get_character_suggestion": {"free": 1, "plus": 1, "pro": 1, "studio": 1},
        "analyze_character_concept": {"free": 1, "plus": 1, "pro": 1, "studio": 1},
        "batch_character_suggestions": {"free": 5, "plus": 5, "pro": 5, "studio": 5},
        "generate_character_sheet": {"free": 20, "plus": 20, "pro": 20, "studio": 20},
        
        # Episode & Storyboard
        "generate_episode_ideas": {"free": 3, "plus": 3, "pro": 3, "studio": 3},
        "generate_initial_cuts": {"free": 5, "plus": 5, "pro": 5, "studio": 5},
        "generate_direction_options": {"free": 2, "plus": 2, "pro": 2, "studio": 2},
        "generate_panel_image": {"free": 12, "plus": 12, "pro": 12, "studio": 12},
        "bg_generate_cut_image": {"free": 8, "plus": 8, "pro": 8, "studio": 8},
        
        # Utilities
        "generate_image": {"free": 10, "plus": 10, "pro": 10, "studio": 10},
        "modify_image": {"free": 8, "plus": 8, "pro": 8, "studio": 8},
        
        # Legacy / Fallbacks
        "director_suggestion": {"free": 1, "plus": 1, "pro": 1, "studio": 1},
        "upscale": {"free": 10, "plus": 10, "pro": 10, "studio": 10},
    }

    def check_credits(self, session: Session, workspace_id: UUID, action_type: str) -> int:
        """
        Calculates cost and checks if workspace has enough credits.
        Returns the cost if sufficient, raises AppException if not.
        """
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            raise AppException(error_code=ErrorCode.NOT_FOUND_WORKSPACE)

        tier = workspace.tier if workspace.tier else "free"
        
        # Get cost
        try:
            cost = self.PRICING.get(action_type, {}).get(tier, 5) # Default to 5 if action or tier not found
        except Exception:
            cost = 5 
            
        if cost > workspace.credits:
             raise AppException(
                error_code=ErrorCode.PAYMENT_INSUFFICIENT_CREDITS,
                detail=f"Insufficient credits. Required: {cost}, Available: {workspace.credits}",
                extra={"required": cost, "available": workspace.credits}
            )
            
        return cost

    def deduct_credits(self, session: Session, workspace_id: UUID, user_id: UUID, action_type: str) -> Workspace:
        """
        Deducts credits and records transaction.
        """
        cost = self.check_credits(session, workspace_id, action_type)
        
        workspace = session.get(Workspace, workspace_id)
        
        # Deduct
        workspace.credits -= cost
        session.add(workspace)
        
        # Record Transaction
        transaction = CreditTransaction(
            workspace_id=workspace_id,
            user_id=user_id,
            amount=-cost,
            action_type=action_type,
            timestamp=datetime.utcnow()
        )
        session.add(transaction)
        
        session.commit()
        session.refresh(workspace)
        
        return workspace

    def check_daily_refill(self, session: Session, workspace_id: UUID) -> bool:
        """
        Grants 50 daily credits if not already granted today.
        Returns True if refill occurred, False otherwise.
        """
        # Check if already refilled today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        statement = select(CreditTransaction).where(
            CreditTransaction.workspace_id == workspace_id,
            CreditTransaction.action_type == "daily_refill",
            CreditTransaction.timestamp >= today_start
        )
        existing_refill = session.exec(statement).first()
        
        if existing_refill:
            return False
            
        # Grant Refill
        workspace = session.get(Workspace, workspace_id)
        if not workspace:
            return False
            
        workspace.credits += 50
        session.add(workspace)
        
        # Record Transaction
        # Note: We use the workspace owner's ID or a system ID if available. 
        # Here we assume owner_id is available and correct.
        transaction = CreditTransaction(
            workspace_id=workspace_id,
            user_id=workspace.owner_id, 
            amount=50,
            action_type="daily_refill",
            timestamp=datetime.utcnow()
        )
        session.add(transaction)
        
        session.commit()
        session.refresh(workspace)
        return True

billing_service = BillingService()
