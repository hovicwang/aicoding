# ClipForge AI 生产环境部署指南

## 必需的服务端响应头

ffmpeg.wasm 依赖 `SharedArrayBuffer`，要求页面具备**跨源隔离**（Cross-Origin Isolation）状态。
生产服务器必须下发以下两个 HTTP 响应头：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

缺少这两个头会导致 `self.crossOriginIsolated === false`，`SharedArrayBuffer` 不可用，ffmpeg.wasm 裂变功能将失败。

### 常见服务器配置

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # 静态资源根目录（vite build 产物）
    root /var/www/clipforge/dist;
    index index.html;

    # 跨源隔离头（ffmpeg.wasm 必须）
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;

    # SPA 路由兜底
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # 注意：COEP 头需要在所有资源响应上保持，Nginx add_header 默认只对 2xx 生效
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
    }
}
```

#### Vercel / Netlify
在项目根目录配置文件中加入：
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

### 跨源资源注意事项

开启 `COEP: require-corp` 后，所有跨源资源（字体、图片、脚本）必须满足以下任一条件：
1. 响应头包含 `Cross-Origin-Resource-Policy: cross-origin`
2. 资源通过 `crossorigin="anonymous"` 加载且服务器返回正确的 CORS 头
3. 资源与页面同源

本项目已为 Google Fonts 链接添加 `crossorigin="anonymous"`。
若仍有资源被阻断，请将它们改为同源托管（如 `@fontsource` 自托管字体）。

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
