/***********************************************************
 * License MIT
 * Copyright (c) 2016 Luke Plaster <notatestuser@gmail.com>
 * Copyright (c) 2025 Yang Shen
 **********************************************************/

import { type DependTreeNode } from "./remote-ls.js";

function makePrefix(key: string, last: boolean) {
  var str = (last ? '└' : '├');
  if (key) {
    str += '─ ';
  } else {
    str += '──┐';
  }
  return str;
}

type GrowBranchCallback = (line: string) => void;

function growBranch(key: string, root: DependTreeNode, last: boolean, lastStates: [DependTreeNode, boolean][], showValues: boolean, hideFunctions: boolean | Function, callback: GrowBranchCallback) {
  let line = "",
    circular = false,
    lastStatesCopy = lastStates.slice(0);

  if (lastStatesCopy.push([ root, last ]) && lastStates.length > 0) {
    // based on the "was last element" states of whatever we're nested within,
    // we need to append either blankness or a branch to our line
    lastStates.forEach((lastState, idx) => {
      if (idx > 0) {
        line += (lastState[1] ? ' ' : '│') + '  ';
      }
      if (!circular && lastState[0] === root) {
        circular = true;
      }
    });

    // the prefix varies based on whether the key contains something to show and
    // whether we're dealing with the last element in this collection
    line += makePrefix(key, last) + key;

    // append values and the circular reference indicator
    showValues && (typeof root !== 'object' || root instanceof Date) && (line += ': ' + root);
    circular && (line += ' (circular ref.)');

    callback(line);
  }

  // can we descend into the next item?
  if (!circular) {
    root.children.sort((a, b) => a.name.localeCompare(b.name));
    root.children.forEach((branch, idx) => {
      // the last key is always printed with a different prefix, so we'll need to know if we have it
      let lastKey = idx === root.children.length - 1;

      // hold your breath for recursive action
      growBranch(branch.name, branch, lastKey, lastStatesCopy, showValues, hideFunctions, callback);
    });
  }
}

export function asTree(obj: DependTreeNode, showValues: boolean, hideFunctions: boolean | Function) {
  let tree: string[] = [];
  growBranch(".", obj, false, [], showValues, hideFunctions, (line) => {
    tree.push(line);
  });
  return tree.join("\n");
}
