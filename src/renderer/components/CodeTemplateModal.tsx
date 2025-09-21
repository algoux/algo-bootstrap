import React, { Component, RefObject } from 'react';
import { Modal, Select, Button, message, Tag } from 'antd';
import MonacoEditor from 'react-monaco-editor';
import sm from '@/utils/modules';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';

const { Option } = Select;

interface CodeTemplateModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CodeTemplateModalState {
  selectedLang: string;
  template: string;
  originalTemplate: string;
  loading: boolean;
  saving: boolean;
}

class CodeTemplateModal extends Component<CodeTemplateModalProps, CodeTemplateModalState> {
  private editorRef: RefObject<any>;

  constructor(props: CodeTemplateModalProps) {
    super(props);
    this.state = {
      selectedLang: 'c',
      template: '',
      originalTemplate: '',
      loading: false,
      saving: false,
    };
    this.editorRef = React.createRef();
  }

  private languageOptions = [
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
  ];

  private loadTemplate = async (lang: string) => {
    try {
      this.setState({ loading: true });
      const currentTemplate = await sm.vsc.getInitTemplateConfig(lang);
      const templateContent = currentTemplate || '';
      this.setState({
        template: templateContent,
        originalTemplate: templateContent,
      });
    } catch (error) {
      logRenderer.error('[CodeTemplateModal] loadTemplate error:', error);
      message.error('加载模板失败');
      this.setState({
        template: '',
        originalTemplate: '',
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  private handleLanguageChange = async (lang: string) => {
    if (this.hasUnsavedChanges()) {
      const confirmed = await msg.confirm(
        '舍弃更改',
        '有未保存的内容，切换语言将舍弃这些更改，要继续吗？',
      );
      if (!confirmed) {
        return;
      }
    }

    this.setState({ selectedLang: lang });
    this.loadTemplate(lang);
  };

  private handleEditorChange = (value: string | undefined) => {
    this.setState({ template: value || '' });
  };

  private handleSave = async () => {
    try {
      this.setState({ saving: true });
      await sm.vsc.updateInitTemplateConfig(this.state.selectedLang, this.state.template);
      this.setState({ originalTemplate: this.state.template });
    } catch (error) {
      logRenderer.error('[CodeTemplateModal] save error:', error);
      msg.error('保存失败');
    } finally {
      this.setState({ saving: false });
    }
  };

  private handleClose = () => {
    this.props.onClose();
  };

  private hasUnsavedChanges = (): boolean => {
    return this.state.template !== this.state.originalTemplate;
  };

  componentDidMount() {
    if (this.props.visible) {
      this.loadTemplate(this.state.selectedLang);
    }
  }

  componentDidUpdate(prevProps: CodeTemplateModalProps) {
    if (this.props.visible && !prevProps.visible) {
      this.loadTemplate(this.state.selectedLang);
    }
  }

  private get editorOptions() {
    return {
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line' as const,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 20,
      wordWrap: 'on' as const,
    };
  }

  render() {
    const { visible } = this.props;
    const { selectedLang, template, loading, saving } = this.state;

    return (
      <Modal
        title="设置代码初始化模板"
        visible={visible}
        onCancel={this.handleClose}
        width={620}
        maskClosable={false}
        style={{ left: 100, top: sm.platform.isMac ? 100 : 40 }}
        footer={[
          <Button key="close" onClick={this.handleClose}>
            关闭
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            disabled={!this.hasUnsavedChanges()}
            onClick={this.handleSave}
          >
            保存
          </Button>,
        ]}
        destroyOnClose
      >
        <div className="--mb-md-lg">
          <label className="--mr-md --text-bold">选择语言</label>
          <Select
            value={selectedLang}
            onChange={this.handleLanguageChange}
            size="small"
            style={{ width: 80 }}
            disabled={loading}
          >
            {this.languageOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, height: `${15 * 20 + 2}px` }}>
          <MonacoEditor
            language={selectedLang}
            value={template}
            onChange={this.handleEditorChange}
            options={this.editorOptions}
            editorDidMount={(editor) => {
              (this.editorRef as any).current = editor;
            }}
          />
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          可用
          <Tag color="geekblue" className="--ml-sm --mr-sm">
            {'${0}'}
          </Tag>
          标识光标落点。在 VS Code 中创建新的 .{selectedLang} 文件后，键入
          <Tag color="geekblue" className="--ml-sm --mr-sm">
            ac
          </Tag>
          以初始化此代码。
        </div>
      </Modal>
    );
  }
}

export default CodeTemplateModal;
