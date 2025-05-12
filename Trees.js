//IntervalTree
class Interval {
  constructor(low, high) {
    this.low = low;
    this.high = high;
  }
}

class Node {
  constructor(interval) {
    this.interval = interval;
    this.max = interval.high;
    this.left = null;
    this.right = null;
  }
}

function insertRec(root, interval) {
  if (root == null) {
    return new Node(interval);
  }
  if (interval.low < root.interval.low) {
    root.left = insertRec(root.left, interval);
  } else {
    root.right = insertRec(root.right, interval);
  }
  root.max = Math.max(
    root.interval.high,
    root.left ? root.left.max : -Infinity,
    root.right ? root.right.max : -Infinity,
  );

  return root;
}

function checkOverlapping(i1, i2) {
  return i1.low < i2.high && i2.low < i1.high;
}

function hasOverlapRec(root, interval) {
  if (root == null) return false;

  if (checkOverlapping(root.interval, interval)) return true;

  if (root.left != null && root.left.max >= interval.low) {
    return hasOverlapRec(root.left, interval);
  } else {
    return hasOverlapRec(root.right, interval);
  }
}

function findMin(root) {
  while (root.left != null) {
    root = root.left;
  }
  return root;
}

function removeRec(root, interval) {
  if (root == null) return null;

  if (
    interval.low == root.interval.low &&
    interval.high == root.interval.high
  ) {
    //arrive at the node

    if (root.left == null) return root.right;
    else if (root.right == null) return root.left;

    //replace with node with the lowest low in interval in the right subtree since it makes sure new root has low interval value of >= deleted node's low interval value
    root.interval = findMin(root.right).interval;
    root.right = removeRec(root.right, root.interval);
  } else if (interval.low < root.interval.low) {
    root.left = removeRec(root.left, interval);
  } else {
    root.right = removeRec(root.right, interval);
  }

  root.max = Math.max(
    root.interval.high,
    root.left ? root.left.max : -Infinity,
    root.right ? root.right.max : -Infinity,
  );

  return root;
}

class IntervalTree {
  constructor() {
    this.root = null;
  }

  insert(interval) {
    this.root = insertRec(this.root, interval);
  }

  hasOverlap(interval) {
    return hasOverlapRec(this.root, interval);
  }

  isEmpty() {
    return this.root == null;
  }
  remove(interval) {
    this.root = removeRec(this.root, interval);
  }
}

export { Interval, IntervalTree };
/*
//Test cases
function runTests() {
    let tree = new IntervalTree();
  
    // Insert intervals
    console.log("Inserting intervals: [1,3], [5,7], [10,15], [6,8]");
    tree.insert(new Interval(1, 3));
    tree.insert(new Interval(5, 7));
    tree.insert(new Interval(10, 15));
    tree.insert(new Interval(6, 8)); // Note: [6,8] lies within [5,7] range
  
    // Test overlap queries before removal
    console.log("Test Overlap Before Removal");
    console.log("Query [2,4] should overlap with [1,3]:", tree.hasOverlap(new Interval(2, 4))); // true
    console.log("Query [4,5] should NOT overlap any:", tree.hasOverlap(new Interval(4, 5))); // false
    console.log("Query [5,7] should overlap:", tree.hasOverlap(new Interval(5, 7))); // true
    console.log("Query [12,20] should overlap with [10,15]:", tree.hasOverlap(new Interval(12, 20))); // true
    console.log("Query [16,18] should NOT overlap any:", tree.hasOverlap(new Interval(16, 18))); // false
  
    // Remove interval [5,7] (node with two children)
    console.log("\nRemoving interval [5,7]");
    tree.remove(new Interval(5, 7));
  
    // Test overlap queries after removal of [5,7]
    console.log("Test Overlap After Removing [5,7]");
    // Querying [5,7] should now return false
    console.log("Query [5,6] should Not overlap:", tree.hasOverlap(new Interval(5, 6))); // Expected: false
    // [6,8] is still in the tree, so a query overlapping that range might still return true.
    console.log("Query [6,8] should overlap (if [6,8] exists):", tree.hasOverlap(new Interval(6, 8)));
  
    // Remove interval [1,3]
    console.log("\nRemoving interval [1,3]");
    tree.remove(new Interval(1, 3));
    console.log("Query [2,4] should NOT overlap:", tree.hasOverlap(new Interval(2, 4))); // Expected: false
  
    // Remove interval [10,15]
    console.log("\nRemoving interval [10,15]");
    tree.remove(new Interval(10, 15));
    console.log("Query [12,20] should NOT overlap:", tree.hasOverlap(new Interval(12, 20))); // Expected: false
  
    // Final check: tree should only have [6,8] left
    console.log("\nFinal check:");
    console.log("Query [6,8] should overlap:", tree.hasOverlap(new Interval(6, 8))); // Expected: true
    console.log("Is tree empty? (Expected false):", tree.root === null);
  }
  
  runTests();
*/
