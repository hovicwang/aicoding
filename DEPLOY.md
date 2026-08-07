# ClipForge AI 生产环境部署指南

## 服务端配置

本项目使用 `@ffmpeg/core` 单线程版（通过 Web Worker 运行），**不需要 SharedArrayBuffer / COOP / COEP 跨源隔离头**。

生产服务器只需标准的 SPA 静态托管配置即可。

### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # 静态资源根目录（vite build 产物）
    root /var/www/clipforge/dist;
    index index.html;

    # SPA 路由兜底
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Vercel / Netlify
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 浏览器存储配额

- 原始视频与裂变变体存储在 IndexedDB，受浏览器存储配额限制
- 桌面 Chrome 通常有 `磁盘可用空间 / 2` 的配额，移动端受限更严
- 建议用户定期清理旧项目（删除项目会自动清理对应 IndexedDB 数据）
- 浏览器内 ffmpeg 转码对 >500MB 的原视频会拒绝执行，避免 tab OOM

## 构建与发布

```bash
# 安装依赖
pnpm install

# 类型检查 + lint + 构建
pnpm run check
pnpm run lint
pnpm run build

# 产物在 dist/，可直接部署到任意静态托管
```

## 已知限制

- ffmpeg 核心约 30MB，首次裂变需从 CDN 加载（unpkg → jsdelivr → fastly 多源回退）
- 浏览器内转码速度受设备性能限制，大文件建议使用服务端转码
- IndexedDB 在隐私模式/禁用状态下会降级，视频无法持久化但上传/播放仍可用（需保持标签页打开）
