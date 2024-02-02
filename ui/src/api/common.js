/**
 * 获取对象在浏览器中的绝对位置（没有考虑滚动条的影响，与实际鼠标位置有差异；父级div、body、html的滚动条都会影响）
 * @param {Document} obj
 * @returns {left,top};
 */
function getPosition(obj) {
  var left = 0;
  var top = 0;
  while (obj != null && obj != document.body) {
    left += obj.offsetLeft;
    top += obj.offsetTop;
    obj = obj.offsetParent;
  }
  // console.log("Left Is : " + left + "\tTop   Is : " + top);
  return {
    left,
    top,
  };
}

// html2canvas转换时忽略的元素
const ignoreElements = [
  'head',
  'body',
  'link',
  'style',
  'title',
  'meta',
  'svg',
  'g',
  'path',
  'use',
  'defs',
  'circle',
  'polygon',
  'rect',
  'lineargradient',
  'stop',
  'animatetransform',
  'marker',
  'mask',
  'hr',
  'canvas',
];

/**
 *
 * @param {Element} svg
 * @returns
 */
function svgToImage(svg) {
  let left, top;

  // 转图片前需要去掉left、top等定位元素，转换后再还原回来
  if (svg.style.position) {
    left = svg.style.left;
    top = svg.style.top;
    svg.style.left = '';
    svg.style.top = '';
  }

  // 线条宽度小于文字时，需调整宽度
  let texts = svg.getElementsByTagName('text');
  if (texts.length > 0) {
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (text.innerHTML != '●') {
        let width = parseInt(text.getBBox().width);
        let sw = parseInt(svg.style.width.replace('px', ''));
        if (sw < width) {
          width += 4;
          let vb = svg.getAttribute('viewBox').split(' ');
          let sl = parseInt(left.replace('px', ''));
          vb[0] = sl - (vb[2] == 4 ? 15 : 10); // 虚线（4）、箭头、圆圈
          left = vb[0] + 'px';
          vb[2] = width;
          svg.style.width = width;
          svg.setAttribute('viewBox', vb.join(' '));
        }
      }
    }
  }

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  let img = new Image();
  let data64 = window.btoa(unescape(encodeURIComponent(svg.outerHTML))); //svg内容中可以有中文字符
  img.src = 'data:image/svg+xml;base64,' + data64;
  img.width = svg.style.width.replace('px', '');
  img.height = svg.style.height.replace('px', '');
  img.style.left = left;
  img.style.top = top;
  svg.style.left = left;
  svg.style.top = top;

  return img;
}

function getRange(div) {
  let sel,
    range,
    editableDiv = div;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      // console.log("sel:", sel);
      // console.log("range:", range);
      if (
        range.commonAncestorContainer.parentNode == editableDiv ||
        range.commonAncestorContainer == editableDiv
      ) {
        range.anchorOffset = sel.anchorOffset; //光标开始位置
        range.focusOffset = sel.focusOffset; //光标结束位置
        return range;
      }
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    if (range.parentElement() == editableDiv) {
      return range;
    }
  }

  return null;
}

/**
 * 递归查找compt下所有符合type类型的元素，并push到items中
 * @param {UIElement} compt
 * @param {*} type
 * @param {Array} items
 */
const traverseType = function (compt, type, items) {
  if (!compt) return;
  if (compt.belongType && compt.belongType(type)) items.push(compt);

  // console.log(compt.itemRefs);
  if (compt.itemRefs && compt.itemRefs.length > 0) {
    compt.itemRefs
      .slice(0)
      .sort((a, b) => a.column - b.column)
      .forEach((o) => {
        traverseType(o, type, items);
      });
  }
};

export default {
  ignoreElements,

  getPosition,
  svgToImage,

  getRange,
  traverseType,
};
