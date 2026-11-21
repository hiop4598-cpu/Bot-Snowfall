const fs = require('fs');
const path = require('path');

// สร้างโฟลเดอร์เก็บไฟล์อัปโหลดอัตโนมัติ
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// เปิดให้เข้าถึงไฟล์ใน public และ public/uploads ได้ตรงๆ
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// API รับไฟล์รูป / GIF แบบ raw หรือ multipart อย่างง่าย
app.post('/api/upload', express.raw({ type: '*/*', limit: '15mb' }), (req, res) => {
  try {
    const rawExt = String(req.headers['x-file-ext'] || '.gif').toLowerCase().replace(/[^a-z0-9.]/g, '');
    const ext = ['.gif', '.png', '.jpg', '.jpeg', '.webp'].includes(rawExt) ? rawExt : '.gif';
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ ok: false, error: 'ไม่พบข้อมูลไฟล์' });
    }
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const fullPath = path.join(uploadDir, fileName);
    fs.writeFileSync(fullPath, req.body);
    return res.json({ ok: true, url: `/uploads/${fileName}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'อัปโหลดไฟล์ไม่สำเร็จ' });
  }
});
