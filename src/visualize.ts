import { RbTree, Color } from './RbTree';
import type { ReadonlyRbTreeNode } from './RbTree';

export function visualize<T>(tree: RbTree<T>) : string {
    const { root, doubleBlackNode } = tree;
    let result = 'digraph{size="10,0";shape=circle;node[width=0.6,height=0.6];';
    if (!root) {
      result += '}';
      return result;
    }
    const queue : ReadonlyRbTreeNode<T>[] = [root];
    result += `${root.key}[label="${getLabel(root)}",${getColor(root)}];`;
    while (queue.length > 0) {
      const node = queue.shift()!;
      const left = node.left;
      const right = node.right;
      if (left) {
        result += `${left.key}[label="${getLabel(left)}",${getColor(left)}];${node.key} -> ${left.key};`
        queue.push(left);
      }
      if (right) {
        result += `${right.key}[label="${getLabel(right)}",${getColor(right)}];${node.key} -> ${right.key};`
        queue.push(right);
      }
    }
    result += '}';
    return result;

    function getLabel(node: ReadonlyRbTreeNode<T>) : T | string {
      if (tree.pendingDelete === node) {
        return '';
      } else {
        return node.key;
      }
    }
    function getColor(node: ReadonlyRbTreeNode<T>) {
      let result = 'color=black,style=filled,';
      if (node === doubleBlackNode) {
        result += 'fillcolor=black';
      } else if (node.color === Color.RED) {
        result += 'fillcolor=red';
      } else {
        result += 'fillcolor=gray';
      }
      return result;
    };
}
