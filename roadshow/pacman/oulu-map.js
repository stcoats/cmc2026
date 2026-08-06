(function (root, factory) {
  var map = factory();
  if (typeof module !== 'undefined') module.exports = map;
  if (root) root.OULU_MAP = map;
})(typeof window === 'undefined' ? null : window, function () {
  var width = 70;
  var height = 20;
  var grid = Array.from({ length: height }, function () {
    return Array(width).fill(0);
  });

  function horizontal(x1, x2, y) {
    for (var x = x1; x <= x2; x++) grid[y][x] = 1;
  }

  function vertical(x, y1, y2) {
    for (var y = y1; y <= y2; y++) grid[y][x] = 1;
  }

  // A connected outer maze loop, with OULU embedded as four distinct route shapes.
  horizontal(4, 60, 1); horizontal(4, 60, 15); vertical(4, 1, 15); vertical(60, 1, 15);

  horizontal(6, 16, 3); horizontal(6, 16, 13); vertical(6, 3, 13); vertical(16, 3, 13);
  vertical(20, 3, 13); vertical(30, 3, 13); horizontal(20, 30, 13);
  vertical(35, 3, 13); horizontal(35, 44, 13);
  vertical(48, 3, 13); vertical(58, 3, 13); horizontal(48, 58, 13);

  // Short links into the outer loop, keeping the letters readable instead of joining them together.
  vertical(11, 1, 3); vertical(11, 13, 15);
  vertical(20, 1, 3); vertical(25, 13, 15);
  vertical(35, 1, 3); vertical(39, 13, 15);
  vertical(48, 1, 3); vertical(53, 13, 15);

  // Ghost house inside the first U. Its exit joins the lower maze route.
  horizontal(23, 27, 7); horizontal(23, 27, 10);
  vertical(23, 7, 10); vertical(27, 7, 10); vertical(25, 10, 15);

  function makeMask() {
    return Array.from({ length: height }, function () { return Array(width).fill(0); });
  }

  function markHorizontal(mask, x1, x2, y) {
    for (var x = x1; x <= x2; x++) mask[y][x] = 1;
  }

  function markVertical(mask, x, y1, y2) {
    for (var y = y1; y <= y2; y++) mask[y][x] = 1;
  }

  // Letter masks are only for rendering. The complete grid above remains the engine's route graph.
  var letters = [
    { color: '#ff2b32', mask: makeMask() },
    { color: '#ffe600', mask: makeMask() },
    { color: '#20e5ec', mask: makeMask() },
    { color: '#ff9ad5', mask: makeMask() }
  ];
  markHorizontal(letters[0].mask, 6, 16, 3); markHorizontal(letters[0].mask, 6, 16, 13); markVertical(letters[0].mask, 6, 3, 13); markVertical(letters[0].mask, 16, 3, 13);
  markVertical(letters[1].mask, 20, 3, 13); markVertical(letters[1].mask, 30, 3, 13); markHorizontal(letters[1].mask, 20, 30, 13);
  markVertical(letters[2].mask, 35, 3, 13); markHorizontal(letters[2].mask, 35, 44, 13);
  markVertical(letters[3].mask, 48, 3, 13); markVertical(letters[3].mask, 58, 3, 13); markHorizontal(letters[3].mask, 48, 58, 13);

  function segmentsForGrid() {
    var segments = [];
    for (var y = 0; y < height; y++) {
      var x = 0;
      while (x < width) {
        if (!grid[y][x]) { x++; continue; }
        var start = x;
        while (x < width && grid[y][x]) x++;
        segments.push({ x: start, y: y, w: x - start });
      }
    }
    for (var x = 0; x < width; x++) {
      var y = 0;
      while (y < height) {
        if (!grid[y][x]) { y++; continue; }
        var start = y;
        while (y < height && grid[y][x]) y++;
        segments.push({ x: x, y: start, h: y - start });
      }
    }
    return segments;
  }

  function draw(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#2020ff';
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    for (var y = 1; y <= 16; y++) {
      for (var x = 4; x <= 61; x++) {
        if (!grid[y][x]) continue;
        // The original engine offsets its 464px playfield by 45px/25px inside the 554px canvas.
        var px = x * 8 + 13;
        var py = y * 8 + 25;
        if (!grid[y - 1][x]) { context.beginPath(); context.moveTo(px, py); context.lineTo(px + 8, py); context.stroke(); }
        if (!grid[y + 1][x]) { context.beginPath(); context.moveTo(px, py + 8); context.lineTo(px + 8, py + 8); context.stroke(); }
        if (!grid[y][x - 1]) { context.beginPath(); context.moveTo(px, py); context.lineTo(px, py + 8); context.stroke(); }
        if (!grid[y][x + 1]) { context.beginPath(); context.moveTo(px + 8, py); context.lineTo(px + 8, py + 8); context.stroke(); }
      }
    }

    function drawMask(mask, color) {
      context.strokeStyle = color;
      for (var row = 1; row <= 16; row++) {
        for (var column = 4; column <= 61; column++) {
          if (!mask[row][column]) continue;
          var px = column * 8 + 13;
          var py = row * 8 + 25;
          // Use the complete route grid for edges, so a coloured letter never closes an open maze tunnel.
          if (!grid[row - 1][column]) { context.beginPath(); context.moveTo(px, py); context.lineTo(px + 8, py); context.stroke(); }
          if (!grid[row + 1][column]) { context.beginPath(); context.moveTo(px, py + 8); context.lineTo(px + 8, py + 8); context.stroke(); }
          if (!grid[row][column - 1]) { context.beginPath(); context.moveTo(px, py); context.lineTo(px, py + 8); context.stroke(); }
          if (!grid[row][column + 1]) { context.beginPath(); context.moveTo(px + 8, py); context.lineTo(px + 8, py + 8); context.stroke(); }
        }
      }
    }

    letters.forEach(function (letter) { drawMask(letter.mask, letter.color); });

  }

  return { grid: grid, segments: segmentsForGrid(), draw: draw };
});
