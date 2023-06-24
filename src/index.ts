import { requestInsert, requestDelete, getCurrentState } from './backend';

import * as d3viz from 'd3-graphviz';
import * as d3selection from 'd3-selection';
import * as d3transition from 'd3-transition';
import * as interpolate from 'd3-interpolate';
import * as d3color from 'd3-color';
const d3 = { ...d3viz, ...d3selection, ...d3transition, ...interpolate, ...d3color };



const graphContainerElement = nonNull<HTMLDivElement>(document.getElementById('graph-container'));
const inputElement = nonNull<HTMLInputElement>(document.getElementById('input'));
const insertElement = nonNull<HTMLInputElement>(document.getElementById('insert'));
const deleteElement = nonNull<HTMLInputElement>(document.getElementById('delete'));

insertElement.addEventListener('click', function () {
    const key = inputElement.value;
    inputElement.value = '';
    if (key) {
      requestInsert(key).then((response) => {
        if (response.ok) {
          updateImage(response.updates);
        };
      });
    }
});
deleteElement.addEventListener('click', function () {
    const key = inputElement.value;
    inputElement.value = '';
    if (key) {
      requestDelete(key).then((response) => {
        if (response.ok) {
          updateImage(response.updates);
        };
      });
    }
});



const transition = () => d3.transition().duration(700) as unknown as d3transition.Transition<HTMLDivElement, unknown, null, undefined>;
const graphViz = d3.select(graphContainerElement).graphviz().transition(transition);

getCurrentState().then((state) => updateImage(state.updates))
    .then(() => {
      graphContainerElement.firstElementChild!.id = 'graph';
    });




async function updateImage(updates: string[]) {
    for (const update of updates) {
      await new Promise<void>((resolve) => {
        graphViz.renderDot(update, () => {
          setTimeout(resolve, 700);
        });
      });
    }
    // graphElement.src = `./api/graph.svg`;
}

function nonNull<T>(value: any): T;
function nonNull<T>(value: T | null | undefined): T;
function nonNull(value: any) {
    if (value == null) {
        throw new Error('Unexpected null');
    }
    return value;
}