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
      drawTitle: false,
      drawSubtitle: false,
      drawLyrics: false,
      drawCredits: false,
      drawPartNames: false,
      drawMeasureNumbers: false,
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
    if (this.props.file !== prevProps.file) {
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
