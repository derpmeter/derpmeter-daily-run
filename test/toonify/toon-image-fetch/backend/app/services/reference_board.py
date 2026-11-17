"""
Character Reference Board Generator
PIL을 사용하여 캐릭터 레퍼런스 보드를 합성하는 유틸리티
"""
from PIL import Image, ImageDraw, ImageFont
import io
import requests
from typing import List, Dict, Optional, Tuple
import math

from app.services.storage import storage


# 상수 정의
BOARD_SIZE = 2048  # 보드 해상도 (정사각형)
MAX_CHARS_PER_BOARD = 4  # 보드당 최대 캐릭터 수
BORDER_COLOR = (255, 0, 0)  # 빨간색 테두리
BORDER_WIDTH = 8  # 테두리 두께
LABEL_FONT_SIZE = 48  # 라벨 폰트 크기
PADDING = 40  # 전체 패딩
CELL_PADDING = 20  # 셀 내부 패딩
LABEL_HEIGHT = 80  # 라벨 영역 높이


def download_image(url: str) -> Optional[Image.Image]:
    from app.services.storage import load_image_ref
    b = load_image_ref(url)
    return Image.open(io.BytesIO(b)).convert("RGBA") if b else None


def get_default_font(size: int = LABEL_FONT_SIZE) -> ImageFont.FreeTypeFont:
    """시스템 폰트 또는 기본 폰트 반환"""
    # 한글 지원 폰트 우선순위 목록
    font_paths = [
        "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",  # Linux (Nanum)
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",      # Linux (Nanum fallback)
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",  # Linux (Noto)
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",  # macOS
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",  # macOS fallback
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux fallback
    ]
    
    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size)
        except (OSError, IOError):
            continue
    
    # 최후의 수단: PIL 기본 폰트
    return ImageFont.load_default()


def create_character_cell(
    image: Image.Image, 
    name: str, 
    cell_size: int,
    font: ImageFont.FreeTypeFont
) -> Image.Image:
    """
    단일 캐릭터 셀 생성 (이미지 + 빨간 테두리 + 이름 라벨)
    
    Args:
        image: 캐릭터 이미지
        name: 캐릭터 이름
        cell_size: 셀 크기 (정사각형)
        font: 라벨용 폰트
    
    Returns:
        합성된 셀 이미지
    """
    # 셀 캔버스 생성 (흰색 배경)
    cell = Image.new("RGBA", (cell_size, cell_size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(cell)
    
    # 이미지 영역 계산 (라벨 영역 제외)
    image_area_height = cell_size - LABEL_HEIGHT - CELL_PADDING * 2
    image_area_width = cell_size - CELL_PADDING * 2
    
    # 이미지 리사이즈 (비율 유지)
    img_ratio = image.width / image.height
    area_ratio = image_area_width / image_area_height
    
    if img_ratio > area_ratio:
        # 이미지가 더 넓음 → 너비에 맞춤
        new_width = image_area_width
        new_height = int(new_width / img_ratio)
    else:
        # 이미지가 더 높음 → 높이에 맞춤
        new_height = image_area_height
        new_width = int(new_height * img_ratio)
    
    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # 이미지 중앙 배치
    img_x = CELL_PADDING + (image_area_width - new_width) // 2
    img_y = CELL_PADDING + (image_area_height - new_height) // 2
    
    cell.paste(resized_image, (img_x, img_y), resized_image if resized_image.mode == 'RGBA' else None)
    
    # 빨간색 테두리 그리기
    border_rect = [
        CELL_PADDING - BORDER_WIDTH // 2,
        CELL_PADDING - BORDER_WIDTH // 2,
        cell_size - CELL_PADDING + BORDER_WIDTH // 2,
        cell_size - LABEL_HEIGHT - CELL_PADDING + BORDER_WIDTH // 2
    ]
    draw.rectangle(border_rect, outline=BORDER_COLOR, width=BORDER_WIDTH)
    
    # 이름 라벨 그리기 (중앙 정렬)
    label_y = cell_size - LABEL_HEIGHT + (LABEL_HEIGHT - LABEL_FONT_SIZE) // 2
    
    # 텍스트 크기 계산
    bbox = draw.textbbox((0, 0), name, font=font)
    text_width = bbox[2] - bbox[0]
    label_x = (cell_size - text_width) // 2
    
    draw.text((label_x, label_y), name, fill=BORDER_COLOR, font=font)
    
    return cell


def create_reference_board(
    characters: List[Dict[str, str]],
    board_size: int = BOARD_SIZE
) -> Image.Image:
    """
    최대 4명의 캐릭터를 포함하는 레퍼런스 보드 생성
    
    Args:
        characters: [{"name": "이름", "image_url": "URL"}, ...]
        board_size: 보드 해상도
    
    Returns:
        합성된 보드 이미지
    """
    if not characters:
        raise ValueError("At least one character is required")
    
    # 최대 4명까지만 처리
    chars = characters[:MAX_CHARS_PER_BOARD]
    num_chars = len(chars)
    
    # 보드 캔버스 생성 (흰색 배경)
    board = Image.new("RGBA", (board_size, board_size), (255, 255, 255, 255))
    
    # 그리드 계산 (1명: 1x1, 2명: 2x1, 3-4명: 2x2)
    if num_chars == 1:
        cols, rows = 1, 1
    elif num_chars == 2:
        cols, rows = 2, 1
    else:
        cols, rows = 2, 2
    
    # 셀 크기 계산
    usable_width = board_size - PADDING * 2
    usable_height = board_size - PADDING * 2
    cell_width = usable_width // cols
    cell_height = usable_height // rows
    cell_size = min(cell_width, cell_height)
    
    # 폰트 로드
    font = get_default_font()
    
    # 각 캐릭터 셀 생성 및 배치
    for idx, char in enumerate(chars):
        name = char.get("name", f"Character {idx + 1}")
        image_url = char.get("image_url")
        
        # 이미지 다운로드
        char_image = download_image(image_url)
        if not char_image:
            # 이미지 없으면 플레이스홀더 생성
            char_image = Image.new("RGBA", (512, 512), (200, 200, 200, 255))
            placeholder_draw = ImageDraw.Draw(char_image)
            placeholder_draw.text((200, 240), "?", fill=(100, 100, 100), font=font)
        
        # 셀 생성
        cell = create_character_cell(char_image, name, cell_size, font)
        
        # 위치 계산
        col = idx % cols
        row = idx // cols
        
        # 중앙 정렬을 위한 오프셋 계산
        total_grid_width = cols * cell_size
        total_grid_height = rows * cell_size
        offset_x = PADDING + (usable_width - total_grid_width) // 2
        offset_y = PADDING + (usable_height - total_grid_height) // 2
        
        x = offset_x + col * cell_size
        y = offset_y + row * cell_size
        
        board.paste(cell, (x, y))
    
    return board


def create_reference_boards(
    characters: List[Dict[str, str]]
) -> List[bytes]:
    """
    캐릭터 목록에서 필요한 만큼의 레퍼런스 보드 생성
    4명 초과 시 여러 보드 생성
    
    Args:
        characters: [{"name": "이름", "image_url": "URL"}, ...]
    
    Returns:
        보드 이미지 바이트 리스트
    """
    if not characters:
        return []
    
    # 4명씩 그룹으로 나누기
    num_boards = math.ceil(len(characters) / MAX_CHARS_PER_BOARD)
    boards = []
    
    for i in range(num_boards):
        start_idx = i * MAX_CHARS_PER_BOARD
        end_idx = start_idx + MAX_CHARS_PER_BOARD
        char_group = characters[start_idx:end_idx]
        
        # 보드 생성
        board_image = create_reference_board(char_group)
        
        # PNG 바이트로 변환
        buffer = io.BytesIO()
        board_image.save(buffer, format="PNG", optimize=True)
        boards.append(buffer.getvalue())
    
    return boards


def generate_board_prompt_description(
    characters: List[Dict[str, str]],
    board_index: int = 0
) -> str:
    """
    프롬프트에 포함할 보드 설명 생성
    
    Args:
        characters: 캐릭터 정보 리스트
        board_index: 보드 인덱스 (0부터 시작)
    
    Returns:
        프롬프트용 설명 문자열
    """
    start_idx = board_index * MAX_CHARS_PER_BOARD
    end_idx = start_idx + MAX_CHARS_PER_BOARD
    char_group = characters[start_idx:end_idx]
    
    positions = ["Top-left", "Top-right", "Bottom-left", "Bottom-right"]
    
    lines = [f"[Reference Image {board_index + 1}] is the CHARACTER REFERENCE BOARD:"]
    
    for idx, char in enumerate(char_group):
        name = char.get("name", f"Character {idx + 1}")
        description = char.get("description", "")
        outfit = char.get("outfit", "")
        
        desc_parts = []
        if description:
            desc_parts.append(description)
        if outfit:
            desc_parts.append(f"wearing {outfit}")
        
        full_desc = ", ".join(desc_parts) if desc_parts else "No description"
        pos = positions[idx] if idx < len(positions) else f"Position {idx + 1}"
        
        lines.append(f"- {pos} ({name}): {full_desc}")
    
    lines.append("")
    lines.append("CRITICAL: Each character MUST wear their EXACT outfit as shown in the reference board.")
    
    return "\n".join(lines)
