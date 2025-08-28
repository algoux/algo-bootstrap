import React from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import IPCKeys from 'common/configs/ipc';
import { logRenderer } from '@/utils/logger';

interface TerminalProps {
  terminalId: string;
  className?: string;
  style?: React.CSSProperties;
}

interface TerminalState {
  isConnected: boolean;
}

export default class Terminal extends React.Component<TerminalProps, TerminalState> {
  private terminalRef: React.RefObject<HTMLDivElement>;
  private xterm: XTerm | null = null;
  private fitAddon: FitAddon | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(props: TerminalProps) {
    super(props);
    this.terminalRef = React.createRef();
    this.state = {
      isConnected: false,
    };
  }

  componentDidMount() {
    this.initializeTerminal();
    this.connectToTerminal();
    this.setupIpcListeners();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  private async initializeTerminal() {
    if (!this.terminalRef.current) return;

    try {
      this.xterm = new XTerm({
        cursorBlink: false,
        cursorStyle: 'block',
        fontSize: 12,
        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
          cursor: 'transparent',
        },
        allowTransparency: true,
        scrollback: 1e9,
        disableStdin: true,
      });

      this.fitAddon = new FitAddon();
      this.xterm.loadAddon(this.fitAddon);

      this.xterm.open(this.terminalRef.current);
      this.fitAddon.fit();

      this.setupResizeObserver();
    } catch (error) {
      logRenderer.error('[Terminal] failed to initialize terminal:', error);
    }
  }

  private setupResizeObserver() {
    if (!this.terminalRef.current || !this.fitAddon) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.fitAddon) {
        this.fitAddon.fit();
      }
    });

    this.resizeObserver.observe(this.terminalRef.current);
  }

  private async connectToTerminal() {
    try {
      const res = await ipc.callMain(IPCKeys.terminalConnect, {
        terminalId: this.props.terminalId,
      });

      if (res && res.connected) {
        this.setState({ isConnected: true });
        this.displayOutput(res.data);
      }
    } catch (error) {
      logRenderer.error('[Terminal] failed to connect to terminal:', error);
      if (this.xterm) {
        this.xterm.write('Failed to connect to terminal\r\n');
      }
    }
  }

  private setupIpcListeners() {
    ipc.answerMain(IPCKeys.terminalOutput, async (res) => {
      if (res.terminalId === this.props.terminalId) {
        this.displayOutput(res.data);
      }
    });

    ipc.answerMain(IPCKeys.terminalClosed, async (res) => {
      if (res.terminalId === this.props.terminalId && this.xterm) {
        this.xterm.write(`\r\nTerminal process exited with code ${res.exitCode} in ${res.time}ms`);
        this.setState({ isConnected: false });
      }
    });
  }

  private displayOutput(output: string) {
    if (!this.xterm) return;
    this.xterm.write('\x1b[0m');
    this.xterm.write(output);
  }

  private cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.xterm) {
      this.xterm.dispose();
      this.xterm = null;
    }

    if (this.fitAddon) {
      this.fitAddon.dispose();
      this.fitAddon = null;
    }
  }

  render() {
    const { className, style } = this.props;

    return (
      <div className={`terminal-container ${className || ''}`} style={style}>
        <div
          ref={this.terminalRef}
          className="terminal-content"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  }
}
