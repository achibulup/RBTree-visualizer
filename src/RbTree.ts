enum Color {
  RED,
  BLACK
}

type RbTreeNode<T> = {
  key: T;
  color: Color;
  left: RbTreeNode<T> | null;
  right: RbTreeNode<T> | null;
  parent: RbTreeNode<T> | null;
}

type ReadonlyRbTreeNode<T> = {
  readonly key: T;
  readonly color: Color;
  readonly left: ReadonlyRbTreeNode<T> | null;
  readonly right: ReadonlyRbTreeNode<T> | null;
  readonly parent: ReadonlyRbTreeNode<T> | null;
};

function RbTreeNode<T>(key: T) : RbTreeNode<T> {
  return {
      key,
      color: Color.RED,
      left: null,
      right: null,
      parent: null
  };
}

type RbTreeCallbacks<T> = {
stepComplete?: () => void,
readWrite?: (a: ReadonlyRbTreeNode<T>) => void,
comp?: (a: T, b: T) => void,
rotate?: (a: ReadonlyRbTreeNode<T>) => void,
color?: (a: ReadonlyRbTreeNode<T>, c: Color) => void,
insert?: (a: ReadonlyRbTreeNode<T>) => void,
delete?: (a: ReadonlyRbTreeNode<T>) => void,
}

enum Side {
  LEFT,
  RIGHT
}

function flip(side: Side) : Side {
  return side === Side.LEFT ? Side.RIGHT : Side.LEFT;
}

function whichSide(node: ReadonlyRbTreeNode<any>) : Side | null {
  if (node.parent == null) {
    return null;
  }
  return node.parent.left === node ? Side.LEFT : Side.RIGHT;
}

function getChild<T>(node: RbTreeNode<T>, side: Side) : RbTreeNode<T> | null;
function getChild<T>(node: ReadonlyRbTreeNode<T>, side: Side) : ReadonlyRbTreeNode<T> | null;
function getChild(node: RbTreeNode<any>, side: Side) : RbTreeNode<any> | null {
  return side === Side.LEFT ? node.left : node.right;
}

function setChild<T>(node: RbTreeNode<T>, side: Side, child: RbTreeNode<T> | null) {
  if (side === Side.LEFT) {
      node.left = child;
  } else {
      node.right = child;
  }
}

function sibling<T>(node: RbTreeNode<T>) : RbTreeNode<T> | null;
function sibling<T>(node: ReadonlyRbTreeNode<T>) : ReadonlyRbTreeNode<T> | null;
function sibling<T>(node: RbTreeNode<any>) : RbTreeNode<any> | null {
  const parent = node.parent;
  if (parent == null) {
    return null;
  }
  return parent.left === node ? parent.right : parent.left;
}



class RbTree<T> {
  #root: RbTreeNode<T> | null = null; 
  #size: number = 0;
  #comparator: (a: T, b: T) => number = (a, b) => a > b ? 1 : a < b ? -1 : 0;
  #doubleBlackNode: RbTreeNode<T> | null = null;
  #pendingDelete: RbTreeNode<T> | null = null;
  #stepCompleteCallback? : () => void;
  #readWriteCallback? : (a: ReadonlyRbTreeNode<T>) => void;
  #compCallback? : (a: T, b: T) => void;
  #rotateCallback? : (a: ReadonlyRbTreeNode<T>) => void;
  #colorCallback? : (a: ReadonlyRbTreeNode<T>, c: Color) => void;
  #insertCallback? : (a: ReadonlyRbTreeNode<T>) => void;
  #deleteCallback? : (a: ReadonlyRbTreeNode<T>) => void;
  constructor(comp?: (a: T, b: T) => number, callBacks?: RbTreeCallbacks<T>);
  constructor (callback: RbTreeCallbacks<T>);
  constructor(...args: any[]) {
      let comp: ((a: T, b: T) => number) | undefined;
      let callBacks: RbTreeCallbacks<T> | undefined;
      for (const arg of args.slice(0, 2)) {
        if (typeof arg === 'function') {
          comp = arg;
        } else {
          callBacks = arg;
        }
      }
      if (comp) {
        this.comparator = comp;
      }
      if (callBacks) {
        this.#stepCompleteCallback = callBacks.stepComplete;
        this.#readWriteCallback = callBacks.readWrite;
        this.#compCallback = callBacks.comp;
        this.#rotateCallback = callBacks.rotate;
        this.#colorCallback = callBacks.color;
        this.#insertCallback = callBacks.insert;
        this.#deleteCallback = callBacks.delete;
      }
  }
  get size() {
      return this.#size;
  }
  get comparator() {
      return this.#comparator;
  }
  set comparator(comp: (a: T, b: T) => number) {
      this.#comparator = comp;
  }
  get root() {
      return this.#root;
  }
  get doubleBlackNode() : ReadonlyRbTreeNode<T> | null {
      return this.#doubleBlackNode;
  }
  get pendingDelete() : ReadonlyRbTreeNode<T> | null {
      return this.#pendingDelete;
  }
  cloneTree() : RbTreeNode<T> | null {
      if (this.#root == null) {
        return null;
      }
      const cloneRoot : RbTreeNode<T> = { ...this.#root };
      const queue = [[cloneRoot, this.#root]];
      for (let i = 0; i < queue.length; ++i) {
        const [cloneNode, node] = queue[i];
        const left = node.left;
        const right = node.right;
        if (left) {
          const cloneLeft = { ...left };
          cloneNode.left = cloneLeft;
          cloneLeft.parent = cloneNode;
          queue.push([cloneLeft, left]);
        }
        if (right) {
          const cloneRight = { ...right };
          cloneNode.right = cloneRight;
          cloneRight.parent = cloneNode;
          queue.push([cloneRight, right]);
        }
      }
      return cloneRoot;
  }

  contains(key: T) : boolean {
      return this.#find(key) != null;
  }
  
  insert(key: T) : boolean {
      const insertPos = this.#findInsertPos(key);
      if (insertPos && this.comparator(insertPos.key, key) === 0) {
        return false;
      }
      const newNode = RbTreeNode(key);
      // console.log(`inserting ${key}: ${newNode.color}, parent: ${newNode.parent?.key}, left: ${newNode.left?.key}, right: ${newNode.right?.key}`);
      if (insertPos == null) {
        this.#root = newNode;
      } else {
        const side = this.#compare(insertPos.key, key) > 0 ? Side.LEFT : Side.RIGHT;
        this.#assignChildNode(insertPos, side, newNode);
      }
      this.#stepCompleteCallback?.();
      this.#fixRedRed(newNode);
      this.#insertCallback?.(newNode);
      this.#size++;
      return true;
  }

  delete(key: T) : boolean {
      const node = this.#find(key);
      if (node == null) {
        return false;
      }
      this.#deleteNode(node);
      this.#size--;
      this.#deleteCallback?.(node);
      return true;
  }

  #findInsertPos(key: T) : RbTreeNode<T> | null {
      if (this.#root == null) {
        return null;
      }
      let node = this.#root;
      while(true) {
        this.#readWriteCallback?.(node);
        const compRes = this.#compare(node.key, key);
        if (compRes === 0) {
          return node;
        } else {
          const next = compRes > 0 ? node.left : node.right;
          if (next) {
            node = next;
          } else {
            return node;
          }
        }
      }
  }
  #find(key: T) : RbTreeNode<T> | null {
      const node = this.#findInsertPos(key);
      if (node && this.#compare(node.key, key) === 0) {
        return node;
      } else {
        return null;
      }
  }
  #nextNode(node: RbTreeNode<T>) : RbTreeNode<T> | null {
      this.#readWriteCallback?.(node);
      if (node.right) {
        let next = node.right;
        while (next.left) {
          this.#readWriteCallback?.(next);
          next = next.left;
        }
        return next;
      } else {
        let next = node;
        while (next.parent && next.parent.right === next) {
          this.#readWriteCallback?.(next.parent);
          next = next.parent;
        }
        return next.parent;
      }
  }
  #prevNode(node: RbTreeNode<T>) : RbTreeNode<T> | null {
      if (node.left) {
        let prev = node.left;
        while (prev.right) {
          this.#readWriteCallback?.(prev);
          prev = prev.right;
        }
        return prev;
      } else {
        let prev = node;
        while (prev.parent && prev.parent.left === prev) {
          this.#readWriteCallback?.(prev.parent);
          prev = prev.parent;
        }
        return prev.parent;
      }
  }
  #deleteNode(toDelete: RbTreeNode<T>) {
      this.#pendingDelete = toDelete;
      while (this.#pendingDelete != null) {
        const node : RbTreeNode<T> = this.#pendingDelete;
        const childs = (node.left ? 1 : 0) + (node.right ? 1 : 0);
        if (childs === 1) {    // which means this node is black and the child is red
          const child = (node.left || node.right)!; 
          this.#replaceChild(node, child);
          this.#assignColor(child, Color.BLACK);
          this.#pendingDelete = null;
          this.#stepCompleteCallback?.();
          return;
        } else if (childs === 2) {
          const next = this.#nextNode(node)!;
          [node.key, next.key] = [next.key, node.key];
          this.#pendingDelete = next;
          this.#stepCompleteCallback?.();
          continue;
        } else {
          const parent = node.parent;
          if (parent == null) {} 
          else if (node.color === Color.RED) {} 
          else {
            this.#doubleBlackNode = node;
            this.#stepCompleteCallback?.();
            this.#fixDoubleBlack();
          }
          this.#replaceChild(node, null);
          this.#pendingDelete = null;
          this.#stepCompleteCallback?.();
          return;
        }
      }
  }
  #fixRedRed(node: RbTreeNode<T>) {
      while (true) { // in every iteration, `node` is the node to be fixed 
        this.#readWriteCallback?.(node);
        const parent = node.parent;
        // console.log(`node: ${node.key}, parent: ` + parent?.key);
        if (parent == null) {
          this.#assignColor(node, Color.BLACK);
          this.#stepCompleteCallback?.();
          return;
        } else if (parent.color === Color.BLACK) {
          this.#readWriteCallback?.(parent);
          return;
        } else {
          const grandParent = parent.parent!; // grandParent will not be null and will be black
          const uncle = sibling(parent)!;
          if (uncle && uncle.color === Color.RED) {
            this.#readWriteCallback?.(uncle);
            this.#readWriteCallback?.(grandParent);
            this.#assignColor(parent, Color.BLACK);
            this.#assignColor(uncle, Color.BLACK);
            this.#assignColor(grandParent, Color.RED);
            node = grandParent;
            this.#stepCompleteCallback?.();
            continue;
          } else {
            this.#fixRedRedByRotation(node);
            return;
          }
        }
      }
  }
  #fixDoubleBlack() {
      while (this.#doubleBlackNode != null) { // in every iteration, `node` is the node to be fixed
        const node = this.#doubleBlackNode;
        console.log(`fixing double black: ${node.key}`);
        const parent = node.parent;
        if (parent == null) {
          if (this.doubleBlackNode === node) {
            this.#doubleBlackNode = null;
            this.#stepCompleteCallback?.();
          }
          return;
        }
        const side = whichSide(node)!;
        const siblingNode = sibling(node)!; 
        if (siblingNode.color === Color.RED) { // parentColor is black
          this.#rotate(parent, side);
          this.#assignColor(parent, Color.RED);
          this.#assignColor(siblingNode, Color.BLACK);
          this.#stepCompleteCallback?.();
          continue; // node is still double black
        } else {
          const parentColor = parent.color;
          const outerNephew = getChild(siblingNode, flip(side));
          const innerNephew = getChild(siblingNode, side);
          if (outerNephew && outerNephew.color === Color.RED) {
            this.#rotate(parent, side);
            this.#assignColor(parent, Color.BLACK);
            this.#assignColor(siblingNode, parentColor);
            this.#assignColor(outerNephew, Color.BLACK);
            this.#doubleBlackNode = null;
            this.#stepCompleteCallback?.();
            return;
          } else if (innerNephew && innerNephew.color === Color.RED) {
            this.#rotate(siblingNode, flip(side));
            this.#stepCompleteCallback?.();
            this.#rotate(parent, side);
            this.#assignColor(parent, Color.BLACK);
            this.#assignColor(innerNephew, parentColor);
            this.#assignColor(siblingNode, Color.BLACK);
            this.#doubleBlackNode = null;
            this.#stepCompleteCallback?.();
            return;
          } else {
            this.#assignColor(siblingNode, Color.RED);
            if (parentColor === Color.RED) {
              this.#assignColor(parent, Color.BLACK);
              this.#doubleBlackNode = null;
              this.#stepCompleteCallback?.();
              return;
            } else {
              this.#doubleBlackNode = parent;
              this.#stepCompleteCallback?.();
              continue;
            }
          }
        }
      }
  }
  #fixRedRedByRotation(node: RbTreeNode<T>) {
      let parent = node.parent!;
      const grandParent = parent.parent!;
      const nodeSide = whichSide(node)!;
      const parentSide = whichSide(parent)!;
      if (nodeSide != parentSide) {
        this.#rotate(parent, parentSide);
        [parent, node] = [node, parent];
        this.#stepCompleteCallback?.();
      }
      this.#rotate(grandParent, flip(parentSide));
      this.#assignColor(grandParent, Color.RED);
      this.#assignColor(parent, Color.BLACK);
      this.#assignColor(node, Color.RED);
      this.#stepCompleteCallback?.();
  }
  #rotate(rootNode: RbTreeNode<T>, side: Side) {
      this.#rotateCallback?.(rootNode);
      const pivot = getChild(rootNode, flip(side))!;
      const pivotChild = getChild(pivot, side);
      this.#replaceChild(rootNode, pivot);
      this.#assignChildNode(pivot, side, rootNode);
      this.#assignChildNode(rootNode, flip(side), pivotChild);
  }
  #assignChildNode(node: RbTreeNode<T>, side: Side, child: RbTreeNode<T> | null) {
      setChild(node, side, child);
      if (child) {
        child.parent = node;
      }
  }
  /// reset oldChild's parent and return old parent of newChild or null if newChild is null
  #replaceChild(oldChild: RbTreeNode<T>, newChild: RbTreeNode<T> | null) : RbTreeNode<T> | null {
      const parent = oldChild.parent;
      const returnVal = newChild ? newChild.parent : null;
      if (returnVal) {
        setChild(returnVal, whichSide(newChild!)!, null);
      }
      if (parent) {
        setChild(parent, whichSide(oldChild)!, newChild);
      } else { // oldChild is root
        this.#root = newChild;
      }
      oldChild.parent = null;
      if (newChild) {
        newChild.parent = parent;
      }
      return returnVal;
  }
  #compare(a: T, b: T) : number {
      this.#compCallback?.(a, b);
      return this.comparator(a, b);
  }
  #assignColor(node: RbTreeNode<T>, color: Color) {
      this.#colorCallback?.(node, color);
      node.color = color;
  }
}

export {RbTree, RbTreeNode, Color};
export type {ReadonlyRbTreeNode, Side};