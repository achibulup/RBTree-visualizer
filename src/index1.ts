import * as d3viz from 'd3-graphviz';
import * as d3selection from 'd3-selection';
import * as d3transition from 'd3-transition';
import * as interpolate from 'd3-interpolate';
import * as d3color from 'd3-color';
const d3 = { ...d3viz, ...d3selection, ...d3transition, ...interpolate, ...d3color };

const graphContainerElement = nonNull<HTMLDivElement>(document.getElementById("graph-container"));
const inputElement = nonNull<HTMLInputElement>(document.getElementById("input"));
const insertElement = nonNull<HTMLInputElement>(document.getElementById("insert"));
const deleteElement = nonNull<HTMLInputElement>(document.getElementById("delete"));

updateImage();

insertElement.addEventListener('click', function () {
    const key = inputElement.value;
    inputElement.value = '';
    if (key) {
      const dateNow = Date.now();
      fetch(`./api/insert?key=${key}`, {
        method: 'POST'
      }).then((response) => {
        if (response.ok) {
          updateImage();
        };
      });
    }
});
deleteElement.addEventListener('click', function () {
    const key = inputElement.value;
    inputElement.value = '';
    if (key) {
      const dateNow = Date.now();
      fetch(`./api/delete?key=${key}`, {
        method: 'POST'
      }).then((response) => {
        if (response.ok) {
         updateImage();
        };
      });
    }
});

const transition = () => d3.transition().duration(1000) as unknown as d3transition.Transition<HTMLDivElement, unknown, null, undefined>;
const graphViz = d3.select(graphContainerElement).graphviz().transition(transition);

function updateImage() {
    fetch(`./api/graph.dot?${Date.now()}`).then((response) => {
      if (response.ok) {
        response.text().then((dot) => {
          graphViz.renderDot(dot);
        });
      };
    });
    // graphElement.src = `./api/graph.svg?${Date.now()}`;
}

function nonNull<T>(value: any): T;
function nonNull<T>(value: T | null | undefined): T;
function nonNull(value: any) {
    if (value == null) {
        throw new Error('Unexpected null');
    }
    return value;
}