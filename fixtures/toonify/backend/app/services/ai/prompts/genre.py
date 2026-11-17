"""
장르별 프롬프트 수정자

복합 장르 충돌 해결 로직 포함
"""
from typing import List, Optional


# ============================================================================
# 장르별 수정자 정의
# ============================================================================

GENRE_MODIFIERS = {
    "fantasy": {
        "priority": 1,
        "pacing": "fast",
        "emphasis": "action_and_world",
        "content": """## Genre Focus: Fantasy
- Power systems should have clear rules and limitations
- World-building should feel immersive but not overwhelming
- Balance magic/adventure with character moments
- Consider classic tropes but add fresh twists
- Power scaling needs to be consistent and fair
"""
    },
    
    "romance": {
        "priority": 2,
        "pacing": "slow",
        "emphasis": "emotion_and_chemistry",
        "content": """## Genre Focus: Romance
- Emotional beats are paramount - readers want to feel butterflies
- "Slow burn" tension should build gradually
- Supporting characters should aid the ship, not distract
- Consider reader demographics (age, preferences)
- Skinship progression should feel earned and natural
"""
    },
    
    "action": {
        "priority": 1,
        "pacing": "fast",
        "emphasis": "tension_and_spectacle",
        "content": """## Genre Focus: Action
- Fight choreography must be readable in vertical scroll
- Power scaling needs to be consistent and fair
- Stakes should escalate progressively
- Cool moments > realistic physics
- Dynamic panel layouts for impact
"""
    },
    
    "thriller": {
        "priority": 1,
        "pacing": "varied",
        "emphasis": "tension_and_mystery",
        "content": """## Genre Focus: Thriller
- Information control is everything
- Red herrings should be fair (clues hidden in plain sight)
- Tension curves need valleys, not just peaks
- Protagonist vulnerability creates investment
- Strategic reveals for maximum impact
"""
    },
    
    "comedy": {
        "priority": 2,
        "pacing": "varied",
        "emphasis": "timing_and_reactions",
        "content": """## Genre Focus: Comedy
- Timing is visual in webtoons - panel size matters
- Running gags should evolve, not just repeat
- Character-based humor > situation-based humor
- Allow serious moments to make comedy hit harder
- Exaggerated reactions work well in scroll format
"""
    },
    
    "horror": {
        "priority": 1,
        "pacing": "slow",
        "emphasis": "atmosphere_and_dread",
        "content": """## Genre Focus: Horror
- Build dread through atmosphere and pacing
- Use panel layout to control reveals
- Psychological horror often works better than gore
- Reader's imagination is your ally - implication > explicit
- Quiet moments amplify scary moments
"""
    },
    
    "drama": {
        "priority": 2,
        "pacing": "varied",
        "emphasis": "emotion_and_conflict",
        "content": """## Genre Focus: Drama
- Character relationships drive the story
- Internal conflicts are as important as external
- Realistic emotions and consequences
- Nuanced character motivations
- Allow breathing room for emotional processing
"""
    },
    
    "slice_of_life": {
        "priority": 3,
        "pacing": "slow",
        "emphasis": "detail_and_charm",
        "content": """## Genre Focus: Slice of Life
- Small moments matter - find beauty in the mundane
- Character quirks create attachment
- Seasonal/cultural events add rhythm
- Cozy atmosphere is key
- Gentle humor works well
"""
    }
}


# ============================================================================
# 복합 장르 충돌 해결 규칙
# ============================================================================

CONFLICT_RESOLUTION = {
    ("romance", "thriller"): """## Genre Fusion: Romance-Thriller
- Primary: Build romantic tension within suspenseful narrative
- Conflict Resolution: Thriller pacing takes precedence for plot beats,
  but allocate 2-3 panels per chapter for pure romantic moments
- Style: Keep romantic scenes intimate but always with underlying tension
- Danger heightens romantic stakes - use this strategically
""",
    
    ("fantasy", "romance"): """## Genre Fusion: Fantasy-Romance
- Primary: Use fantasy world-building to enable unique romantic dynamics
- Conflict Resolution: Fantasy world rules create obstacles for romance
- Style: Epic scope with intimate character moments
- Power imbalances/differences can drive romantic tension
""",
    
    ("action", "comedy"): """## Genre Fusion: Action-Comedy
- Primary: High-energy fights with comedic timing
- Conflict Resolution: Comedy in dialogue, action in visuals
- Style: Exaggerated reactions during fights, witty banter
- Stakes can fluctuate - not every fight needs to be life-or-death
""",
    
    ("thriller", "horror"): """## Genre Fusion: Thriller-Horror
- Primary: Psychological tension with horror payoffs
- Conflict Resolution: Thriller pacing, horror atmosphere
- Style: Information control creates dread, reveals create horror
- Human antagonists can be as scary as supernatural ones
""",
    
    ("romance", "comedy"): """## Genre Fusion: Rom-Com
- Primary: Romantic development through comedic situations
- Conflict Resolution: Comedy for the journey, romance for the destination
- Style: Misunderstandings drive plot, genuine moments resolve them
- Supporting cast can add humor while couple stays sincere
""",
    
    ("fantasy", "action"): """## Genre Fusion: Fantasy-Action
- Primary: Spectacular power-based combat in a magical world
- Conflict Resolution: World rules define combat possibilities
- Style: Power scaling must be consistent, visuals can be over-the-top
- Training/growth arcs are essential
""",
}


# ============================================================================
# 장르 수정자 조회 함수
# ============================================================================

def get_genre_modifier(
    genres: List[str],
    primary_genre: Optional[str] = None
) -> str:
    """
    장르에 맞는 프롬프트 수정자 반환 (충돌 해결 포함)
    
    Args:
        genres: 장르 리스트
        primary_genre: 우선 장르 (미지정 시 첫 번째 장르)
        
    Returns:
        장르에 맞는 프롬프트 수정자 문자열
    """
    if not genres:
        return ""
    
    # 정규화
    genres_lower = [g.lower().replace("-", "_").replace(" ", "_") for g in genres]
    
    # 단일 장르
    if len(genres_lower) == 1:
        genre = genres_lower[0]
        if genre in GENRE_MODIFIERS:
            return GENRE_MODIFIERS[genre]["content"]
        return ""
    
    # 복합 장르 - 충돌 해결 규칙 확인
    genre_pair = tuple(sorted(genres_lower[:2]))
    if genre_pair in CONFLICT_RESOLUTION:
        return CONFLICT_RESOLUTION[genre_pair]
    
    # 역순도 확인
    genre_pair_reverse = tuple(sorted(genres_lower[:2], reverse=True))
    if genre_pair_reverse in CONFLICT_RESOLUTION:
        return CONFLICT_RESOLUTION[genre_pair_reverse]
    
    # 충돌 규칙이 없는 경우: Primary/Secondary 패턴
    primary = primary_genre.lower() if primary_genre else genres_lower[0]
    secondary = genres_lower[1] if len(genres_lower) > 1 and genres_lower[1] != primary else None
    if secondary is None and genres_lower[0] != primary:
        secondary = genres_lower[0]
    
    result = []
    
    # Primary 장르
    if primary in GENRE_MODIFIERS:
        result.append(GENRE_MODIFIERS[primary]["content"])
    
    # Secondary 장르 (충돌 경고 포함)
    if secondary and secondary in GENRE_MODIFIERS:
        secondary_content = GENRE_MODIFIERS[secondary]["content"]
        result.append(f"""
## Secondary Genre: {secondary.replace('_', ' ').title()}
(Apply these elements where they don't conflict with {primary} priorities)
{secondary_content}
""")
    
    return "\n".join(result)


def get_available_genres() -> List[str]:
    """사용 가능한 모든 장르 리스트 반환"""
    return list(GENRE_MODIFIERS.keys())
