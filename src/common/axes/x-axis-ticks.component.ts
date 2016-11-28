import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { trimLabel } from '../trim-label.helper';
import { reduceTicks } from './ticks.helper';

@Component({
  selector: 'g[xAxisTicks]',
  template: `
    <svg:g #ticksel>
      <svg:g *ngFor="let tick of ticks" class="tick"
        [attr.transform]="tickTransform(tick)">
        <title>{{tickFormat(tick)}}</title>
        <svg:text
          stroke-width="0.01"
          [attr.text-anchor]="textAnchor"
          [attr.transform]="textTransform"
          [style.font-size]="'12px'">
          {{trimLabel(tickFormat(tick))}}
        </svg:text>
      </svg:g>
    </svg:g>

    <svg:g *ngFor="let tick of ticks"
      [attr.transform]="tickTransform(tick)">
      <svg:g *ngIf="showGridLines"
        [attr.transform]="gridLineTransform()">
        <svg:line
          class="gridline-path gridline-path-vertical"
          [attr.y1]="-gridLineHeight"
          y2="0" />
      </svg:g>
    </svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XAxisTicks implements OnChanges, AfterViewInit {
  @Input() scale;
  @Input() orient;
  @Input() tickArguments = [5];
  @Input() tickStroke = '#ccc';
  @Input() tickFormatting;
  @Input() showGridLines = false;
  @Input() gridLineHeight;
  @Input() width;

  @Output() dimensionsChanged = new EventEmitter();

  verticalSpacing: any;
  rotateLabels: any;
  innerTickSize: any;
  outerTickSize: any;
  tickPadding: any;
  textAnchor: any;
  maxTicksLength: any;
  maxAllowedLength: number = 16;
  trimLabel: any;
  adjustedScale: any;
  tickValues: any;
  textTransform: any;
  ticks: any;
  tickFormat: any;
  height: number = 0;

  @ViewChild('ticksel') ticksElement: ElementRef;

  constructor() {
    Object.assign(this, {
      innerTickSize: 6,
      outerTickSize: 6,
      tickPadding: 3,
      rotateLabels: false,
      verticalSpacing: 20,
      textAnchor: 'middle',
      maxTicksLength: 0,
      trimLabel: trimLabel
    });
  }

  ngOnChanges() {
    this.update();
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateDims());
  }

  updateDims() {
    const height = parseInt(this.ticksElement.nativeElement.getBoundingClientRect().height, 10);
    if (height !== this.height) {
      this.height = height;
      this.dimensionsChanged.emit({ height });
      setTimeout(() => this.updateDims());
    }
  }

  update() {
    let scale = this.scale;
    this.ticks = this.getTicks();

    if (this.tickFormatting) {
      this.tickFormat = this.tickFormatting;
    } else if (scale.tickFormat) {
      this.tickFormat = scale.tickFormat.apply(scale, this.tickArguments);
    } else {
      this.tickFormat = function(d) {
        return d;
      };
    }

    let angle = this.getRotationAngle(this.ticks);

    this.adjustedScale = this.scale.bandwidth ? function(d) {
      return this.scale(d) + this.scale.bandwidth() * 0.5;
    } : this.scale;

    this.textTransform = '';
    if (angle !== 0) {
      this.textTransform = `rotate(${angle})`;
      this.textAnchor = 'end';
      this.verticalSpacing = 10;
    } else {
      this.textAnchor = 'middle';
    }

    setTimeout(() => this.updateDims());
  }

  getRotationAngle(ticks) {
    let angle = 0;
    for (let i = 0; i < ticks.length; i++) {
      let tick = ticks[i].toString();
      if (tick.length > this.maxTicksLength) {
        this.maxTicksLength = tick.length;
      }
    }

    let len = Math.min(this.maxTicksLength, this.maxAllowedLength);
    let charWidth = 8; // need to measure this
    let wordWidth = len * charWidth;

    let baseWidth = wordWidth;
    let maxBaseWidth = Math.floor(this.width / ticks.length);

    // calculate optimal angle
    while(baseWidth > maxBaseWidth && angle > -90) {
      angle -= 30;
      baseWidth = Math.cos(angle * (Math.PI / 180)) * wordWidth;
    }

    return angle;
  }

  getTicks() {
    let ticks;
    let maxTicks = this.getMaxTicks();

    if (this.tickValues) {
      ticks = this.tickValues;
    } else if (this.scale.ticks) {
      ticks = this.scale.ticks.apply(this.scale, this.tickArguments);
      if (ticks.length > maxTicks) {
        if (this.tickArguments) {
          this.tickArguments[0] = Math.min(this.tickArguments[0], maxTicks);
        } else {
          this.tickArguments = [maxTicks];
        }
        ticks = this.scale.ticks.apply(this.scale, this.tickArguments);
      }
    } else {
      ticks = this.scale.domain();
      ticks = reduceTicks(ticks, maxTicks);
    }
    return ticks;
  }

  getMaxTicks() {
    let tickWidth = 20;
    return Math.floor(this.width / tickWidth);
  }

  tickTransform(tick) {
    return 'translate(' + this.adjustedScale(tick) + ',' + this.verticalSpacing + ')';
  }

  gridLineTransform() {
    return `translate(0,${-this.verticalSpacing - 5})`;
  }

}