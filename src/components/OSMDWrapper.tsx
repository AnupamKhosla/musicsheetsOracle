'use client';

import { Component, createRef } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';

interface Props {
  file: string;
  autoResize?: boolean;
  drawTitle?: boolean;
}

export default class OSMDWrapper extends Component<Props> {
  private osmd: any = undefined;
  private divRef = createRef<HTMLDivElement>();

  setupOsmd() {
    const options = {
      autoResize: this.props.autoResize !== undefined ? this.props.autoResize : true,
      drawTitle: this.props.drawTitle !== undefined ? this.props.drawTitle : true,
    };
    this.osmd = new OSMD(this.divRef.current!, options);
    this.osmd.load(this.props.file).then(() => {
      this.osmd.zoom = 0.75;
      this.osmd.render();
    });
  }

  componentDidMount() {
    if (this.osmd === undefined) {
      this.setupOsmd();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.drawTitle !== prevProps.drawTitle) {
      this.setupOsmd();
    } else {
      this.osmd.load(this.props.file).then(() => {
        this.osmd.zoom = 0.75;
        this.osmd.render();
      });
    }
  }

  render() {
    return <div ref={this.divRef} />;
  }
}
