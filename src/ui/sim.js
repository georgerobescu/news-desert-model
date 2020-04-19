import K from 'konva';
import Color from 'color';
import HexGridUI from './grid';
import Tweakpane from 'tweakpane';
import interpolate from 'color-interpolate';

const tipEl = document.getElementById('tip');

const colormap = interpolate(['#FFFFFF', '#0000FF']);
const colormap2 = interpolate(['#FFFFFF', '#000000']);
const colormap3 = interpolate(['#FF0000', '#00FF00']);
const colormap4 = interpolate(['#c4fcd7', '#25ba56']);

class SimUI {
  constructor(sim, stage) {
    this.sim = sim;
    this.stage = stage;

    this.settings = {
      prop: 'agents'
    };
    this.pane = new Tweakpane();
    this.pane.addInput(this.settings, 'prop', {
      options: {
        agents: 'agents',
        wealth: 'wealth'
      }
    }).on('change', (val) => {
      this.setProperty(val);
    });

    this.init();
    this.setProperty('agents');
    this.draw();
  }

  init() {
    // Setup grid
    let grid = this.sim.grid;
    let settings = this.settings;
    this.grid = new HexGridUI(this.stage, grid, 15, {
      'mouseenter touchstart': function(ev) {
        let cell = ev.currentTarget;
        let stageEl = this.stage.attrs.container;
        let x = stageEl.clientLeft + cell.attrs.x + this.cellSize;
        let y = stageEl.clientLeft + cell.attrs.y + this.cellHeight/2;
        tipEl.style.display = 'block';
        tipEl.style.left = `${x}px`;
        tipEl.style.top = `${y}px`;
        tipEl.innerText = 'testing';
        let c = grid.cell(cell.pos);
        if (c.publisher) {
          this.showRadius(cell.pos, c.publisher.radius, (c, pos) => {
            let pop = grid.cell(pos).agents;
            let color = cell.pos == pos ? 'red' : colormap4(pop);
            c.baseColor = color;
            return color;
          });
        }
      },
      'mouseout touchend': function(ev) {
        let cell = ev.currentTarget;
        tipEl.style.display = 'none';
        let c = grid.cell(cell.pos);
        if (c.publisher) {
          this.showRadius(cell.pos, c.publisher.radius, (cell, pos) => {
            cell.baseColor = colormap(grid.cell(cell.pos)[settings.prop]);
            return cell.baseColor;
          });
        }
      }
    });

    // Setup publishers
    let layer = new K.Layer();
    this.sim.publishers.forEach((pub) => {
      let cell = this.grid.cell(pub.cell.pos);
      let circ = new K.Circle({
        x: cell.attrs.x + cell.attrs.width/2,
        y: cell.attrs.y + cell.attrs.height/2,
        radius: cell.attrs.width/4,
        fill: 'orange',
        stroke: 'black',
        strokeWidth: 0.5,
        listening: false
      });
      layer.add(circ);
    });
    this.stage.add(layer);
  }

  setProperty(prop) {
    let grid = this.sim.grid;
    grid.rows.forEach((r) => {
      grid.cols.forEach((c) => {
        let cellUI = this.grid.cell([r, c]);
        let cell = grid.cell([r, c]);
        let color = '#000000';
        switch (prop) {
          case 'agents':
            color = colormap(cell.agents);
            break;
          case 'wealth':
            color = colormap(cell.wealth);
            break;
          case 'mix':
            let colorA = new Color(colormap2(cell.agents));
            let colorB = new Color(colormap3(cell.wealth));
            color = colorA.mix(colorB, 0.5).hex();
        }
        cellUI.baseColor = color;
        cellUI.fill(color).draw();
      });
    });
  }

  showEvents() {
    this.sim.grid.cells.forEach((c) => {
      let cell = this.grid.cell(c.pos);
      if (c.events > 0) {
        cell.fill('yellow');
        // gridUI.blink(cell.pos, 'yellow');
      } else {
        cell.fill(cell.baseColor);
      }
      cell.draw();
    });
  }

  draw() {
    this.grid.draw();
  }
}

export default SimUI;
