const vscode = require('vscode');

// �����������䣨MyTreeItem��
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
                title: '����ѹ��'
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

            // �Ľ���ע�ʹ����߼���֧�ֱ����ַ������ݣ�
            let processedText = text
                // Step 1: �����ַ�������
                .replace(/(".*?"|'.*?')/g, (match) => match.replace(/\/\//g, '\u200B'))
                // Step 2: ɾ������ע��
                .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
                // Step 3: �ָ��ַ�������
                .replace(/\u200B/g, '//')
                // Step 4: �������ṹ
                .split('\n')
                .map(line => {
                    line = line.trim();
                    if (!line) return '';

                    // Ԥ����ָ�������
                    if (/^#/.test(line)) {
                        return line.replace(/\s+/g, ' ') + '\n';
                    }

                    // ѹ����ͨ����
                    return line
                        .replace(/([;,{}])\s+/g, '$1')  // ɾ���﷨���ź�Ŀո�
                        .replace(/\s+([=+\-*/%<>!&|^~])/g, '$1') // �����ǰ
                        .replace(/([=+\-*/%<>!&|^~])\s+/g, '$1') // �������
                        .replace(/(\b(int|return|if|else|for|while|do|class|struct)\b)\s+/g, '$1 ');
                })
                .filter(line => line)
                .join(' ')  // �ϲ���һ��
                // Step 5: ��ʽ��Ԥ����ָ������
                .replace(/\n+/g, '\n');

            // д��༭��
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, processedText);
            });
        })
    );
}

module.exports = { activate };