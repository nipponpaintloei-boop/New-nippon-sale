# Nippon Paint - Sales & Stock Management System
ระบบบริหารยอดขาย สต็อกสินค้า คอมมิชชั่น และส่วนแบ่งการตลาด (Market Share) สี Nippon Paint

เว็บแอพพลิเคชันสำหรับพนักงานขายและผู้จัดการสาขา ออกแบบมาให้ทำงานได้อย่างรวดเร็ว รองรับการทำงานทั้งแบบออฟไลน์/Local-First และการเชื่อมต่อซิงค์อัตโนมัติกับ **Google Sheets** และ **Cloud Database**

---

## ✨ ฟีเจอร์หลัก (Key Features)

- 📊 **บันทึกยอดขายและออกบิล (Sales Entry & POS)**: บันทึกรายการขายสีพร้อมคำนวณเบส, ขนาดถัง, ค่าผสมสี และยอดรวมอัตโนมัติ พร้อมพิมพ์ใบสรุปบิลให้ลูกค้า
- 📦 **ระบบจัดการสต็อกสินค้า (Inventory & Stock Control)**:
  - ตัดสต็อกอัตโนมัติแบบเรียลไทม์เมื่อบันทึกขาย
  - ฟังก์ชัน **รับสินค้าเข้าสต็อกทีละหลายรายการ (Bulk Stock-In)** พร้อมค้นหาและระบุจำนวนได้สะดวก
  - แจ้งเตือนสินค้าใกล้หมด (Low Stock) และสินค้าที่ขายเกินสต็อก (Oversold)
- 💰 **คำนวณคอมมิชชั่นพนักงาน (Commission Engine)**: คำนวณค่าคอมมิชชั่นตามเกณฑ์ยอดขาย, ระดับ Tier และโบนัสพิเศษตามเงื่อนไข
- 🏢 **คำนวณค่าเช่าพื้นที่ / ส่วนแบ่งการตลาด (Market Share - MKS)**: สรุปยอดขายเปรียบเทียบกับแบรนด์อื่นและคำนวณค่าบริหารพื้นที่
- 🔄 **Google Sheets Auto-sync**: ซิงค์ข้อมูลยอดขายและสต็อกขึ้น Google Sheets อัตโนมัติในเบื้องหลัง (Background Task) โดยไม่หน่วงการใช้งานหน้าเว็บ
- 📁 **นำเข้า/ส่งออกข้อมูล (Import/Export & Backup)**: รองรับไฟล์ Excel (.xlsx), มีระบบ Audit Log ติดตามประวัติการเปลี่ยนแปลง และระบบสำรอง/กู้คืนข้อมูล

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Data & Export**: SheetJS (`xlsx`), HTML2Canvas, JSPDF, Canvas Confetti
- **Integration**: Google Identity Services (GIS) & Google Sheets API v4

---

## 🚀 ขั้นตอนการ Push ขึ้น GitHub

### 1. สร้าง Repository บน GitHub
1. ล็อกอินเข้าสู่ [GitHub.com](https://github.com)
2. คลิกปุ่ม **New** (หรือเครื่องหมาย `+` มุมขวาบน) เพื่อสร้าง Repository ใหม่
3. ตั้งชื่อ Repository เช่น `nippon-paint-sales-stock`
4. เลือกระดับเป็น **Public** หรือ **Private** ตามต้องการ
5. **ไม่ต้อง** ติ๊กถูกที่ "Add a README file" (เพราะในโปรเจกต์มีไฟล์ README อยู่แล้ว)
6. คลิก **Create repository**

### 2. รันคำสั่ง Git ในเครื่องของคุณ
เปิด Terminal หรือ Command Prompt ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่งต่อไปนี้:

```bash
# 1. ตรวจสอบหรือเริ่มต้น Git
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้าสู่ Staging
git add .

# 3. บันทึก Commit แรก
git commit -m "feat: initial commit of Nippon Paint Sales & Stock Management System"

# 4. เปลี่ยนชื่อ Branch หลักเป็น main
git branch -M main

# 5. เชื่อมต่อกับ Repository บน GitHub (แทนที่ USERNAME และ REPO ด้วยของคุณ)
git remote add origin https://github.com/USERNAME/nippon-paint-sales-stock.git

# 6. Push ไฟล์ขึ้น GitHub
git push -u origin main
```

---

## 💻 วิธีเปิดใช้งานในเครื่อง (Local Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. เริ่มต้น Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000`

### 3. Build สำหรับ Production
```bash
npm run build
```
ไฟล์ที่ผ่านการคอมไพล์จะถูกสร้างไว้ในโฟลเดอร์ `dist/`

---

## 🌐 วิธีนำเว็บแอพขึ้นใช้งานออนไลน์ (Deployment Options)

### ตัวเลือกที่ 1: Deploy บน Vercel (แนะนำ - ใช้งานฟรีและเร็วที่สุด)
1. ไปที่ [Vercel.com](https://vercel.com) แล้วล็อกอินด้วยบัญชี GitHub
2. คลิก **Add New...** > **Project**
3. เลือก Repository `nippon-paint-sales-stock` ที่คุณเพิ่ง Push ขึ้นไป
4. Vercel จะตรวจพบว่าเป็น **Vite** ให้อัตโนมัติ:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. คลิก **Deploy** — รอประมาณ 1 นาที จะได้ URL เช่น `https://nippon-paint-sales-stock.vercel.app` ใช้งานได้ทันที!

> *หมายเหตุ: ในโปรเจกต์นี้มีไฟล์ `vercel.json` เตรียมไว้ให้แล้ว ทำให้รองรับ Single Page Application (SPA) routing ได้สมบูรณ์แบบ*

---

### ตัวเลือกที่ 2: Deploy บน Netlify
1. ไปที่ [Netlify.com](https://www.netlify.com) แล้วล็อกอินด้วย GitHub
2. คลิก **Add new site** > **Import an existing project**
3. เลือก Repository บน GitHub
4. กำหนดค่า Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. คลิก **Deploy Site**

---

### ตัวเลือกที่ 3: Deploy บน GitHub Pages (ฟรีในตัว GitHub)
โปรเจกต์นี้มีไฟล์ GitHub Actions Workflow อยู่ที่ `.github/workflows/deploy.yml` เรียบร้อยแล้ว:
1. ใน GitHub Repository ไปที่แท็บ **Settings**
2. เลือกเมนู **Pages** ด้านซ้ายมือ
3. ในหัวข้อ **Build and deployment** > **Source** ให้เปลี่ยนเป็น:
   👉 **GitHub Actions**
4. เมื่อมีการ push โค้ดขึ้น branch `main` ระบบจะทำการ Build และขึ้นเว็บให้คุณอัตโนมัติ

---

## 🔐 การตั้งค่า Google Sheets Auto-Sync (OAuth 2.0)

เพื่อใช้งานฟังก์ชันซิงค์ข้อมูลยอดขายและสต็อกเข้า Google Sheets โดยอัตโนมัติ:

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ (เช่น `Nippon-Sales-Sync`)
3. ไปที่เมนู **APIs & Services** > **Library**
   - ค้นหา **Google Sheets API** แล้วกด **Enable**
4. ไปที่เมนู **OAuth consent screen**:
   - เลือก User Type เป็น **External**
   - กรอกชื่อแอพ และอีเมลผู้ติดต่อ
   - ในส่วน Scopes ให้เพิ่ม: `.../auth/spreadsheets`
   - ในส่วน Test Users ให้เพิ่มอีเมล Google ของคุณ (เช่น บัญชีที่จะใช้เชื่อมต่อชีต)
5. ไปที่เมนู **Credentials** > **Create Credentials** > **OAuth client ID**:
   - **Application type**: Web application
   - **Name**: Nippon Paint Web App
   - **Authorized JavaScript origins**: ใส่ URL ของเว็บคุณ เช่น:
     - `http://localhost:3000` (สำหรับทดสอบในเครื่อง)
     - `https://your-app.vercel.app` (URL ที่ได้จาก Vercel หรือ Production Domain)
6. คัดลอก **Client ID** (มีลักษณะลงท้ายด้วย `.apps.googleusercontent.com`)
7. ตั้งค่า Client ID ใน Environment Variables ของระบบที่ใช้ Deploy:
   ```env
   VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   ```
   จากนั้น Build/Deploy ใหม่

8. ในแอปกด **"เชื่อม Google Sheets"** > ลงชื่อเข้าใช้ Google > เลือก **"เชื่อม Google Sheet ที่มีอยู่แล้ว"** > วางลิงก์ Google Sheets ของคุณ > กดเชื่อมต่อ

> **หมายเหตุ:** การวางลิงก์ Spreadsheet โดยตรงไม่ต้องใช้ `VITE_GOOGLE_API_KEY` หรือ `VITE_GOOGLE_APP_ID` สำหรับการใช้งานปกติ

---

## 📂 โครงสร้างโฟลเดอร์ (Project Structure)

```text
├── .github/workflows/   # GitHub Actions CI/CD workflows
├── public/              # รูปภาพ โลโก้ และ Static assets
├── src/
│   ├── components/      # React UI Components
│   │   ├── common/      # ปุ่ม, Toast, Alerts
│   │   ├── layout/      # Header, Sidebar, SideDrawer
│   │   ├── modals/      # หน้าต่างบันทึกขาย, รับเข้าสต็อก, Google Sheets, etc.
│   │   └── views/       # หน้า Dashboard, บันทึกขาย, สต็อก, คอมมิชชั่น, MKS
│   ├── config/          # การตั้งค่าระบบ
│   ├── context/         # React Context (AppStateContext จัดการ State ทั้งหมด)
│   ├── data/            # ค่าคงที่, ฐานข้อมูลเริ่มต้น (Default Products & Settings)
│   ├── services/        # Service คำนวณยอด, สต็อก, Export, Google Sheets Sync
│   ├── types/           # TypeScript Types & Interfaces
│   ├── App.tsx          # Main App Component
│   ├── main.tsx         # Entry point
│   └── index.css        # Tailwind CSS
├── .env.example         # ตัวอย่างการตั้งค่าตัวแปรระบบ
├── .gitignore           # รายการไฟล์ที่ไม่ต้อง push ขึ้น Git
├── package.json         # รายการ Dependencies และ Scripts
├── tsconfig.json        # TypeScript Configuration
├── vercel.json          # การตั้งค่า Routing สำหรับ Vercel
└── vite.config.ts       # Vite Configuration
```

---

## 📄 License
ลิขสิทธิ์สำหรับใช้งานภายในองค์กรและระบบงานขายสี Nippon Paint
