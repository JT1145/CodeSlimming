const vscode = require('vscode');

// 保持类名不变（MyTreeItem）
class MyTreeItem extends vscode.TreeItem {
    constructor(label, command) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = command;
        this.iconPath = new vscode.ThemeIcon('zap');
    }
}

class MyTreeDataProvider {
    getTreeItem(element) {
        return element;
    }

    getChildren() {
        return Promise.resolve([
            new MyTreeItem('Code Slimming', {
                command: 'code slimming',
                title: '代码压缩'
            }),
        ]);
    }
}

function activate(context) {
    const treeDataProvider = new MyTreeDataProvider();
    vscode.window.registerTreeDataProvider('csb', treeDataProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand("code slimming", async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const document = editor.document;
            const text = document.getText();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );

            // 改进的注释处理逻辑（支持保留字符串内容）
            let processedText = text
                // Step 1: 保护字符串内容
                .replace(/(".*?"|'.*?')/g, (match) => match.replace(/\/\//g, '\u200B'))
                // Step 2: 删除所有注释
                .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
                // Step 3: 恢复字符串内容
                .replace(/\u200B/g, '//')
                // Step 4: 处理代码结构
                .split('\n')
                .map(line => {
                    line = line.trim();
                    if (!line) return '';

                    // 预处理指令单独成行
                    if (/^#/.test(line)) {
                        return line.replace(/\s+/g, ' ') + '\n';
                    }

                    // 压缩普通代码
                    return line
                        .replace(/([;,{}])\s+/g, '$1')  // 删除语法符号后的空格
                        .replace(/\s+([=+\-*/%<>!&|^~])/g, '$1') // 运算符前
                        .replace(/([=+\-*/%<>!&|^~])\s+/g, '$1') // 运算符后
                        .replace(/(\b(int|return|if|else|for|while|do|class|struct)\b)\s+/g, '$1 ');
                })
                .filter(line => line)
                .join(' ')  // 合并到一行
                // Step 5: 格式化预处理指令区域
                .replace(/\n+/g, '\n');

            // 写入编辑器
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, processedText);
            });
        })
    );
}

module.exports = { activate };