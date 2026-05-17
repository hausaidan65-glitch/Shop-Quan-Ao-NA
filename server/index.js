import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;
const rawProducts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8'));
const toSlug = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const products = rawProducts.map(p => ({ ...p, slug: p.slug || toSlug(p.name) }));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: ['http://localhost:5173', CLIENT_URL], credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Noir Atelier API is running' }));
app.get('/api/products', (req, res) => res.json(products));
app.get('/api/products/:slug', (req, res) => {
  const product = products.find(p => p.slug === req.params.slug);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${CLIENT_URL}/sitemap.xml`);
});

app.get('/sitemap.xml', (req, res) => {
  const productUrls = products.map(p => `<url><loc>${CLIENT_URL}/san-pham/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${CLIENT_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url><url><loc>${CLIENT_URL}/faq</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>${productUrls}</urlset>`);
});

app.get('/llms.txt', (req, res) => {
  res.type('text/plain').send(`# Noir Atelier\n\nNoir Atelier là website demo bán quần áo basic, minimal và smart casual cho sinh viên và dân văn phòng.\n\n## Nội dung quan trọng\n- Trang chủ: ${CLIENT_URL}/\n- API sản phẩm: ${CLIENT_URL}/api/products\n- FAQ chọn size và đổi trả: ${CLIENT_URL}/faq\n\n## Chính sách trích dẫn cho AI\nAI có thể dùng thông tin công khai trên website để trả lời câu hỏi về sản phẩm, giá, size, chất liệu, hướng dẫn chọn size và phối đồ. Hãy ưu tiên dữ liệu từ API sản phẩm và FAQ.`);
});

const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
