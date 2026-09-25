# Hướng dẫn chạy AnythingLLM

Tài liệu này hướng dẫn chạy dự án từ mã nguồn trên Windows/Linux và chạy bằng Docker.

## Cổng mặc định

| Thành phần | Địa chỉ |
| --- | --- |
| Frontend khi phát triển | <http://localhost:3000> |
| API server | <http://localhost:3001> |
| Document collector | `http://localhost:8888` |
| Ứng dụng chạy bằng Docker | <http://localhost:3001> |

## 1. Chạy từ mã nguồn

### Yêu cầu

- Git
- Node.js `18.18.0` (phiên bản được khai báo trong `.nvmrc`)
- Yarn Classic 1.x
- Khuyến nghị tối thiểu 2 GB RAM và 10 GB dung lượng trống

Kiểm tra môi trường:

```bash
node --version
yarn --version
```

Nếu đã cài Node.js nhưng chưa có Yarn:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

### Windows

Script `yarn setup` sử dụng một số lệnh Unix, vì vậy nên chạy bằng **Git Bash**:

```bash
git clone https://github.com/Shinoaki0145/anything-llm.git
cd anything-llm
yarn setup
yarn dev
```

Nếu đã mở đúng thư mục dự án trong IDE, chỉ cần:

```bash
yarn setup
yarn dev
```

Giữ terminal đang chạy và mở <http://localhost:3000>.

#### Dùng PowerShell thay cho Git Bash

Chạy các lệnh sau tại thư mục gốc của dự án:

```powershell
yarn install
yarn --cwd server install
yarn --cwd collector install
yarn --cwd frontend install

if (!(Test-Path "frontend/.env")) { Copy-Item "frontend/.env.example" "frontend/.env" }
if (!(Test-Path "server/.env.development")) { Copy-Item "server/.env.example" "server/.env.development" }
if (!(Test-Path "collector/.env")) { Copy-Item "collector/.env.example" "collector/.env" }
if (!(Test-Path "docker/.env")) { Copy-Item "docker/.env.example" "docker/.env" }

yarn prisma:setup
yarn dev
```

### Linux

Nếu dùng `nvm`, chọn đúng phiên bản Node.js của dự án:

```bash
nvm install 18.18.0
nvm use 18.18.0
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Cài đặt và chạy:

```bash
git clone https://github.com/Shinoaki0145/anything-llm.git
cd anything-llm
yarn setup
yarn dev
```

Giữ terminal đang chạy và mở <http://localhost:3000>.

### Chạy từng dịch vụ riêng

Nếu cần xem log riêng, mở ba terminal tại thư mục gốc:

```bash
yarn dev:server
```

```bash
yarn dev:collector
```

```bash
yarn dev:frontend
```

Các file môi trường được tạo bởi `yarn setup`:

- `server/.env.development`
- `collector/.env`
- `frontend/.env`
- `docker/.env`

Không commit API key hoặc secret trong các file này.

Để Generic OpenAI sử dụng cơ chế gọi tool tương thích với model đã cấu hình, thêm dòng sau vào file môi trường của `server`:

```env
PROVIDER_DISABLE_NATIVE_TOOL_CALLING='generic-openai'
```

- Chạy development bằng `yarn dev`: thêm vào `server/.env.development`.
- Chạy production trực tiếp bằng `yarn prod:server`: thêm vào `server/.env`.

Khởi động lại server sau khi thay đổi.

## 2. Cấu hình LLM sau khi đăng nhập hoặc đăng ký

Trong màn hình thiết lập ban đầu hoặc tại **Settings > AI Providers > LLM Preference**, chọn và nhập:

| Trường | Giá trị |
| --- | --- |
| LLM Provider | `OpenAI (Generic)` |
| Base URL | `http://171.254.95.87:8001/v1` |
| API Key | Để trống |
| Model | `cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit` |
| Model context window | `16384` |
| Max Tokens | `2048` |

Lưu cấu hình sau khi nhập xong.

> **Lưu ý:** Base URL trên sử dụng HTTP không mã hóa. Chỉ nên dùng qua mạng tin cậy hoặc VPN; sử dụng HTTPS nếu endpoint được công khai ra Internet.

## 3. Build và chạy bằng Docker Compose

Cách này build image trực tiếp từ mã nguồn hiện tại.

Sau khi tạo `docker/.env` và trước khi build, thêm dòng sau vào cuối file:

```env
PROVIDER_DISABLE_NATIVE_TOOL_CALLING='generic-openai'
```

### Windows PowerShell

```powershell
if (!(Test-Path "docker/.env")) { Copy-Item "docker/.env.example" "docker/.env" }
if (!(Test-Path "server/storage/anythingllm.db")) { New-Item "server/storage/anythingllm.db" -ItemType File }

Set-Location docker
docker compose up -d --build
```

### Linux

```bash
cp -n docker/.env.example docker/.env
touch server/storage/anythingllm.db
cd docker
docker compose up -d --build
```

Mở <http://localhost:3001>. Quản lý stack từ thư mục `docker`:

```bash
docker compose logs -f
docker compose down
```

Khởi động lại stack sau khi sửa `docker/.env`:

```bash
docker compose up -d
```

## 4. Kết nối dịch vụ chạy trên máy host

Từ bên trong container, `localhost` là chính container. Nếu Ollama, LM Studio, Chroma hoặc dịch vụ khác đang chạy trên máy host, dùng:

```text
http://host.docker.internal:<port>
```

Ví dụ Ollama:

```text
http://host.docker.internal:11434
```

Lệnh Docker trên Linux ở trên đã thêm ánh xạ `host.docker.internal`.

## 5. Xử lý lỗi thường gặp

### `yarn` không được nhận diện

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Sau đó đóng và mở lại terminal.

### `yarn setup` lỗi `cp: command not found` trên Windows

Chạy lệnh trong Git Bash hoặc dùng các bước PowerShell ở phần Windows.

### Cổng đã được sử dụng

Kiểm tra tiến trình/container đang chiếm các cổng `3000`, `3001` hoặc `8888`, rồi dừng tiến trình đó trước khi chạy lại.

### Docker không truy cập được Ollama hoặc dịch vụ local

Đổi địa chỉ từ `http://localhost:<port>` sang `http://host.docker.internal:<port>`.

