#!/usr/bin/env python3
"""
스타일 이미지를 GCS에 업로드하고 프론트엔드 STYLES 배열을 업데이트하는 스크립트

사용법:
  # 프로덕션 GCS에 업로드
  python scripts/upload_style_images_to_gcs.py --bucket toonify-prod-assets
  
  # 개발용 로컬 MinIO에 업로드
  python scripts/upload_style_images_to_gcs.py --local
"""

import os
import sys
import re
import argparse
from pathlib import Path

# GCS 설정
DEFAULT_BUCKET = "toonify-prod-assets"
STYLE_IMAGES_DIR = "frontend/public/images/styles"
FRONTEND_MODAL_FILE = "frontend/src/components/project/modals/ArtStyleSetupModal.tsx"
GCS_PUBLIC_URL_BASE = "https://storage.googleapis.com"

# 스타일 이미지 매핑 (id -> filename)
STYLE_MAPPING = {
    "standard-webtoon": "standard-webtoon.png",
    "classic-manhwa": "classic-manhwa.png",
    "anime-style": "anime-style.png",
    "semi-realism": "semi-realism.png",
    "watercolor": "watercolor.png",
    "oil-painting": "oil-painting.png",
    "impasto": "impasto.png",
    "ink-wash": "ink-wash.png",
    "flat-vector": "flat-vector.png",
    "pixel-art": "pixel-art.png",
    "chibi-sd": "chibi-sd.png",
    "pop-art": "pop-art.png",
    "noir": "noir.png",
    "cyberpunk": "cyberpunk.png",
    "eldritch": "eldritch.png",
    "vintage-comic": "vintage-comic.png",
}


def upload_to_gcs(bucket_name: str, source_dir: Path) -> dict:
    """GCS에 이미지 업로드하고 URL 매핑 반환"""
    try:
        from google.cloud import storage
    except ImportError:
        print("❌ google-cloud-storage 패키지가 필요합니다.")
        print("   pip install google-cloud-storage")
        sys.exit(1)
    
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    url_mapping = {}
    
    for style_id, filename in STYLE_MAPPING.items():
        source_path = source_dir / filename
        if not source_path.exists():
            print(f"⚠️  {filename} 파일 없음, 스킵")
            continue
        
        # GCS 경로: styles/presets/{filename}
        blob_path = f"styles/presets/{filename}"
        blob = bucket.blob(blob_path)
        
        # 업로드
        print(f"📤 업로드 중: {filename} -> gs://{bucket_name}/{blob_path}")
        blob.upload_from_filename(str(source_path), content_type="image/png")
        
        # Public URL 생성
        public_url = f"{GCS_PUBLIC_URL_BASE}/{bucket_name}/{blob_path}"
        url_mapping[style_id] = public_url
        
    return url_mapping


def upload_to_minio(source_dir: Path) -> dict:
    """로컬 MinIO에 이미지 업로드하고 URL 매핑 반환"""
    try:
        from minio import Minio
    except ImportError:
        print("❌ minio 패키지가 필요합니다.")
        print("   pip install minio")
        sys.exit(1)
    
    # 환경변수에서 MinIO 설정 로드
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    bucket_name = os.getenv("MINIO_BUCKET", "toonify-dev")
    secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
    
    client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
    
    # 버킷 확인/생성
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
        print(f"✅ 버킷 생성: {bucket_name}")
    
    url_mapping = {}
    protocol = "https" if secure else "http"
    
    for style_id, filename in STYLE_MAPPING.items():
        source_path = source_dir / filename
        if not source_path.exists():
            print(f"⚠️  {filename} 파일 없음, 스킵")
            continue
        
        # MinIO 경로
        object_path = f"styles/presets/{filename}"
        
        print(f"📤 업로드 중: {filename} -> minio://{bucket_name}/{object_path}")
        client.fput_object(bucket_name, object_path, str(source_path), content_type="image/png")
        
        # URL 생성 (로컬 개발용)
        public_url = f"{protocol}://{endpoint}/{bucket_name}/{object_path}"
        url_mapping[style_id] = public_url
        
    return url_mapping


def update_frontend_styles(url_mapping: dict):
    """프론트엔드 ArtStyleSetupModal.tsx의 imageUrl 업데이트"""
    modal_path = Path(FRONTEND_MODAL_FILE)
    
    if not modal_path.exists():
        print(f"❌ 파일 없음: {modal_path}")
        return False
    
    content = modal_path.read_text(encoding="utf-8")
    original_content = content
    
    # 각 스타일의 imageUrl 업데이트
    for style_id, new_url in url_mapping.items():
        # 패턴: imageUrl: '/images/styles/standard-webtoon.png'
        old_pattern = rf"(id:\s*'{style_id}'[^}}]*imageUrl:\s*)['\"]([^'\"]+)['\"]"
        new_value = f"\\1'{new_url}'"
        
        content = re.sub(old_pattern, new_value, content, flags=re.DOTALL)
    
    if content != original_content:
        modal_path.write_text(content, encoding="utf-8")
        print(f"✅ 프론트엔드 STYLES 배열 업데이트 완료: {modal_path}")
        return True
    else:
        print("ℹ️  변경사항 없음 (이미 업데이트되었거나 패턴 불일치)")
        return False


def print_url_mapping(url_mapping: dict):
    """URL 매핑 테이블 출력"""
    print("\n📋 스타일 이미지 URL 매핑:")
    print("-" * 80)
    for style_id, url in url_mapping.items():
        print(f"  {style_id:20} -> {url}")
    print("-" * 80)


def main():
    parser = argparse.ArgumentParser(description="스타일 이미지를 GCS/MinIO에 업로드")
    parser.add_argument("--bucket", default=DEFAULT_BUCKET, help="GCS 버킷 이름")
    parser.add_argument("--local", action="store_true", help="로컬 MinIO에 업로드")
    parser.add_argument("--dry-run", action="store_true", help="실제 업로드 없이 테스트")
    parser.add_argument("--skip-frontend-update", action="store_true", help="프론트엔드 파일 업데이트 스킵")
    
    args = parser.parse_args()
    
    # 프로젝트 루트 확인
    project_root = Path(__file__).parent.parent
    source_dir = project_root / STYLE_IMAGES_DIR
    
    if not source_dir.exists():
        print(f"❌ 스타일 이미지 디렉토리 없음: {source_dir}")
        sys.exit(1)
    
    print(f"🎨 스타일 이미지 디렉토리: {source_dir}")
    print(f"📁 발견된 이미지: {len(list(source_dir.glob('*.png')))}개")
    
    if args.dry_run:
        print("\n🔍 [DRY RUN] 실제 업로드 없이 테스트합니다.\n")
        url_mapping = {
            style_id: f"https://storage.googleapis.com/{args.bucket}/styles/presets/{filename}"
            for style_id, filename in STYLE_MAPPING.items()
        }
    elif args.local:
        print("\n📦 로컬 MinIO에 업로드합니다.\n")
        url_mapping = upload_to_minio(source_dir)
    else:
        print(f"\n☁️  GCS 버킷 '{args.bucket}'에 업로드합니다.\n")
        url_mapping = upload_to_gcs(args.bucket, source_dir)
    
    print_url_mapping(url_mapping)
    
    if not args.skip_frontend_update:
        print("\n🔧 프론트엔드 STYLES 배열 업데이트 중...")
        update_frontend_styles(url_mapping)
    
    print("\n✅ 완료!")
    print("\n💡 다음 단계:")
    print("   1. 프론트엔드 빌드 및 테스트")
    print("   2. 스타일 선택 후 이미지 생성 테스트")
    print("   3. 백엔드 로그에서 'Adding Style Reference: https://...' 확인")


if __name__ == "__main__":
    main()
