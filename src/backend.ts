import { RbTree } from './RbTree';
import { visualize } from './visualize';

export type Response = {
  ok: boolean;
  comment: string;
  updates: string[];
}

export async function getCurrentState(): Promise<Response> {
    const updates = [visualizeString];
    return { ok: true, comment: '', updates};
}

// this function now can be implemented synchronously, but it used to be async
export async function requestInsert(key: string): Promise<Response> {
    // return fetch(`./api/insert?key=${key}`, {
    //   method: 'POST'
    // });
    const comment = rbt.insert(Number(key)) ? 'inserted' : 'key already exists';
    const updates = await extractChangeLog();
    return { ok: true, comment, updates};
}

// this function now can be implemented synchronously, but it used to be async
export async function requestDelete(key: string): Promise<Response> {
    // return fetch(`./api/delete?key=${key}`, {
    //   method: 'POST'
    // });
    const comment = rbt.delete(Number(key)) ? 'deleted' : 'key not found';
    const updates = await extractChangeLog();
    return{ ok: true, comment, updates};
}



let visualizeString = '';
let changeLog: string[] = [];

const rbt = new RbTree<number>({
  stepComplete() {
      visualizeString = visualize(rbt);
      changeLog.push(visualizeString);
  }
});

[...Array(10).keys()].forEach(i => {
  // const item = i;
  const item = Math.round(Math.random() * 30);
  // console.log(item);
  rbt.insert(item);
});
extractChangeLog();



// this function now can be implemented synchronously, but it used to be async
async function extractChangeLog(): Promise<string[]> {
    // return fetch(`./api/dotChangeLog?${Date.now()}`).then(res => res.text().then(text => text.split('%'))
    const result = changeLog;
    changeLog = [];
    return result;
}