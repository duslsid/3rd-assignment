# RUNNERS — 러닝 의류 쇼핑몰 (3차 과제)

남녀노소 누구나 러닝 시 편하게 입을 수 있는 스포츠 브랜드 **러너스(RUNNERS)** 의 상업용 쇼핑몰입니다.

- 배포 주소 : https://duslsid.github.io/3rd-assignment/
- 데이터베이스 : Supabase (PostgreSQL)
- 배포 : GitHub Pages + GitHub Actions

## 페이지 구성

| 파일 | 화면 |
|---|---|
| `index.html` | 메인 (메인 배너 / 메인 문구 / SEASON BEST / RUNNERS MAGAZINE) |
| `category.html?cat=&sub=` | 하위 메뉴 페이지 (상품 목록) |
| `product.html?slug=` | 상품 상세 페이지 |
| `magazine.html` | 매거진 목록 |
| `article.html?slug=` | 매거진 전문 |
| `login.html` | 로그인 |
| `signup.html` | 회원가입 |
| `mypage.html` | 마이페이지 |
| `wishlist.html` / `cart.html` / `orders.html` | 작성중 |

## 폴더 구조

```
├─ css/style.css          전체 스타일 (PC 전용, 컨테이너 1250px)
├─ js/
│  ├─ config.js           Supabase 접속 정보 (git 제외 / Actions 가 생성)
│  ├─ config.sample.js    설정 파일 예시
│  ├─ db.js               Supabase 연결 + 조회 함수 + 폴더명 파싱
│  ├─ common.js           헤더 / 푸터 / 홍보띠 / TOP 버튼 / 레이어 팝업
│  └─ (페이지별 스크립트)
├─ assets/                로고 / 배너 / 상품 이미지 / 기사 이미지 / 사이즈 가이드
└─ tools/                 원본 에셋 → assets + Supabase 시드 변환 스크립트
```

## 데이터베이스 (Supabase)

| 테이블 | 설명 |
|---|---|
| `products` | 상품. 원본 폴더명(`상위메뉴_하위메뉴_상품명_가격_판매순위`) 보존 |
| `product_images` | 상품 상세 이미지. `is_main` 이 메인이미지 |
| `articles` | 매거진 기사 (제목 / 부제 / 본문 / 이미지) |
| `site_assets` | 로고, 메인 배너, 사이즈 가이드, 상품정보제공고시 |
| `members` | 회원. RLS 로 직접 접근을 막고 아래 RPC 로만 사용 |

RPC 함수 : `check_user_id`, `signup_member`, `login_member`, `find_user_id`, `reset_password`
비밀번호는 `pgcrypto` 의 bcrypt 해시로 저장합니다.

## 로컬에서 실행하기

```bash
cp js/config.sample.js js/config.js   # 값을 채운 뒤
npx serve .                            # 또는 임의의 정적 서버
```

`file://` 로 직접 열면 브라우저 보안 정책 때문에 Supabase 요청이 막히므로 정적 서버로 열어 주세요.

## 원본 에셋에서 다시 만들기

```bash
node tools/build-data.js   # 원본 폴더 스캔 → assets/ 복사 + tools/data.json 생성
node tools/seed.js         # data.json → Supabase 적재
```

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 이 실행되어 GitHub Pages 로 배포됩니다.
저장소 Secrets 에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 가 등록되어 있어야 합니다.
