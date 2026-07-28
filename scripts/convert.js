const fs = require('fs');
const path = require('path');

// 输入 → 输出映射：对应类型
const MAP = {
  'sr_reject_list.module': 'reject.list',
  'sr_direct_list.module': 'direct.list',
  'sr_proxy_list.module': 'proxy.list'
};
const OUT_DIR = path.resolve(__dirname, '../rules');

/**
 * 转换为 Loyalsoldier 标准格式：保留 DOMAIN/DOMAIN-SUFFIX 前缀，去掉动作
 * 示例：DOMAIN-SUFFIX,ad.com,REJECT → DOMAIN-SUFFIX,ad.com
 */
function convertLine(line) {
  line = line.trim();
  if (!line || line.startsWith('#') || line.startsWith('[') || !line.includes(',')) return null;
  const parts = line.split(',');
  if (parts.length < 2) return null;
  // 保留前两部分（类型+域名），丢弃后面的 DIRECT/PROXY/REJECT/NO-RESOLVE
  return parts.slice(0, 2).join(',');
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [inFile, outFile] of Object.entries(MAP)) {
  const inPath = path.join(process.cwd(), inFile);
  if (!fs.existsSync(inPath)) {
    console.warn(`跳过：${inFile} 不存在`);
    continue;
  }
  const lines = fs.readFileSync(inPath, 'utf8').split(/\r?\n/);
  const rules = [];
  lines.forEach(line => {
    const converted = convertLine(line);
    if (converted) rules.push(converted);
  });
  // 去重 + 按字母排序
  const unique = [...new Set(rules)].sort();
  const outLines = [
    `# 来源：${inFile}`,
    `# 生成时间：${new Date().toLocaleString()}`,
    `# 格式：Clash 标准规则（同 Loyalsoldier/clash-rules）`,
    ...unique
  ];
  fs.writeFileSync(path.join(OUT_DIR, outFile), outLines.join('\n'), 'utf8');
  console.log(`✅ 生成：rules/${outFile}（${unique.length} 条规则）`);
}
