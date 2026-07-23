# Hệ Thống Thi Trắc Nghiệm Trực Tuyến - Ứng Dụng Công Nghệ Thông Tin Cơ Bản

Hệ thống thi trắc nghiệm trực tuyến full-stack chuyên nghiệp, hiện đại, dành cho môn **Ứng dụng Công nghệ Thông tin Cơ bản** (cùng chứng chỉ MOS, IC3...).

---

## 🌟 Công Nghệ Sử Dụng

- **Frontend**: ReactJS (Vite), TailwindCSS, React Query, React Router, Axios, Recharts, Lucide Icons.
- **Backend**: Python Django 4.2, Django REST Framework, SimpleJWT (Authentication), drf-yasg (Swagger API Docs).
- **Phân tích Đề thi**: Custom DOCX & PDF AI Importer parser.
- **Database**: PostgreSQL (Production) / SQLite (Development Fallback).
- **Deploy**: Render.com Blueprint (`render.yaml`).

---

## 🔑 Tài Khoản Mặc Định

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Mô Tả |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | Quản trị viên hệ thống (Toàn quyền Dashboard, Học sinh, Đề thi, Kết quả) |
| **STUDENT** | `sv001` | `123` | Sinh viên Nguyễn Văn An (Lớp CNTT01) |
| **STUDENT** | `sv002` | `123` | Sinh viên Trần Thị Bình (Lớp CNTT01) |

---

## 🚀 Hướng Dẫn Khởi Chạy Local

### 1. Chạy Backend (Django API)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python create_admin.py
python manage.py runserver 0.0.0.0:8000
```
- API Base URL: `http://localhost:8000/api/`
- Swagger Documentation: `http://localhost:8000/swagger/`

### 2. Chạy Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000/`

---

## ☁️ Deploy Lên Render.com

1. Push toàn bộ source code này lên một Git Repository (GitHub / GitLab).
2. Đăng nhập vào [Render.com](https://render.com).
3. Chọn **New +** -> **Blueprint**.
4. Kết nối tới Git repository của bạn.
5. Render sẽ tự động đọc file `render.yaml`, khởi tạo PostgreSQL Database, Build Backend Django, thu thập Static files, Migrate DB, Seed Admin, và Build Web Static Frontend React.
