const fs = require('fs');
const path = require('path');

// 配置：输入文件 → 输出文件 + 规则类型
const MAP = {
  'sr_reject_list.module': { out: 'reject.list', action: 'REJECT' },
  'sr_direct_list.module': { out: 'direct.list', action: 'DIRECT' },
  'sr_proxy_list.module': { out: 'proxy.list', action: 'PROXY' }
};
const OUT_DIR = path.resolve(__dirname, '../rules');

function convertLine(line, defaultAction) {
  line = line.trim();
  if (!line || line.startsWith('#') || line.startsWith('[') || !line.includes(',')) return null;
  const parts = line.split(',');
  if (parts.length < 2) return null;
  const last = parts.length - 1;
  const lastVal = parts[last].toUpperCase();
  if (['DIRECT','PROXY','REJECT','REJECT-DROP'].includes(lastVal)) parts.pop();
  else if (lastVal === 'NO-RESOLVE' && parts.length >= 3) parts.splice(parts.length - 2);
  parts.push(defaultAction);
  return parts.join(',');
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [inFile, cfg] of Object.entries(MAP)) {
  const inPath = path.join(process.cwd(), inFile);
  if (!fs.existsSync(inPath)) {
    console.warn(`跳过：${inFile} 不存在`);
    continue;
  }
  const lines = fs.readFileSync(inPath, 'utf8').split(/\r?\n/);
  const outLines = [`# 自动转换：${inFile} → ${cfg.out}`, `# 生成时间：${new Date().toLocaleString()}`];
  lines.forEach(line => {
    const converted = convertLine(line, cfg.action);
    if (converted) outLines.push(converted);
  });
  fs.writeFileSync(path.join(OUT_DIR, cfg.out), outLines.join('\n'), 'utf8');
  console.log(`生成：${cfg.out}（${outLines.length - 2} 条规则）`);
}
