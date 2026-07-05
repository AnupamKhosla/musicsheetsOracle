'use client';

import { Component, createRef } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';

interface Props {
  file?: string;
  xmlContent?: string;
  autoResize?: boolean;
  drawTitle?: boolean;
  /** Current playback beat (0-based). -1 = not playing / reset highlight. */
  currentBeat?: number;
}

export default class OSMDWrapper extends Component<Props> {
  private osmd: any = undefined;
  private divRef = createRef<HTMLDivElement>();
  private timeBeatType = 4;
  private lastBeat = -1;
  private cursorEnabled = false;

  private blobUrl: string | null = null;

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
    this.loadSheet();
  }

  private xmlToBlobUrl(xml: string): string {
    const blob = new Blob([xml], { type: 'application/xml' });
    return URL.createObjectURL(blob);
  }

  private loadSheet() {
    const { file, xmlContent } = this.props;
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    const url = xmlContent ? this.xmlToBlobUrl(xmlContent) : (file || '');
    this.blobUrl = url !== file ? url : null;
    return this.osmd.load(url).then(() => {
      this.osmd.zoom = 0.75;
      this.osmd.render();
      this.setupCursor();
    });
  }

  private setupCursor() {
    try {
      const firstMeasure = this.osmd.Sheet?.SourceMeasures?.[0];
      const ts = firstMeasure?.ActiveTimeSignature;
      if (ts) this.timeBeatType = ts.denominator || 4;

      this.osmd.setOptions({
        cursorsOptions: [
          { type: 0, color: '#E11D48', alpha: 0.45, follow: true },
        ],
      });
      this.osmd.enableOrDisableCursors(true);
      this.cursorEnabled = true;
      this.lastBeat = -1;
    } catch {
      // Cursor API may shift between OSMD versions; stay non-fatal.
      this.cursorEnabled = false;
    }
  }

  private syncCursor(beat: number) {
    if (!this.cursorEnabled || !this.osmd?.cursor) return;
    if (beat < 0) {
      this.osmd.cursor.hide();
      this.lastBeat = -1;
      return;
    }

    const cursor = this.osmd.cursor;
    const targetReal = beat / this.timeBeatType;

    // Going backwards: reset to start and scan forward.
    if (beat < this.lastBeat && typeof cursor.reset === 'function') {
      cursor.reset();
    }
    this.lastBeat = beat;

    const iter = cursor.Iterator;
    if (!iter) return;

    let safety = 0;
    const maxSteps = 10000;
    try {
      while (
        !iter.EndReached &&
        (iter.CurrentTimestamp?.RealValue ?? 0) < targetReal &&
        safety < maxSteps
      ) {
        cursor.next();
        safety++;
      }
      cursor.show();
      cursor.update();
    } catch {
      cursor.hide();
    }
  }

  componentWillUnmount() {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  componentDidMount() {
    if (this.osmd === undefined) {
      this.setupOsmd();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.file !== prevProps.file || this.props.xmlContent !== prevProps.xmlContent) {
      this.cursorEnabled = false;
      this.loadSheet().then(() => {
        if (this.props.currentBeat != null && this.props.currentBeat >= 0) {
          this.syncCursor(this.props.currentBeat);
        }
      });
    } else if (this.props.currentBeat !== prevProps.currentBeat) {
      this.syncCursor(this.props.currentBeat ?? -1);
    }
  }

  render() {
    return <div ref={this.divRef} />;
  }
}
