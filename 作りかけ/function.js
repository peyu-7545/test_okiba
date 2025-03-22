function convertTo2DArray(array, k) {
    if (array.length !== k * k) {
        return "配列の長さがk^2ではありません";
    }

    const result = [];
    for (let i = 0; i < k; i++) {
        result.push([]);
    }

    for (let i = 0; i < array.length; i++) {
        const line = Math.floor(i / k);
        const col = i % k;
        result[line][col] = array[i];
    }

    return result;
}


function visualizeArray(array2D, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error("指定された要素が見つかりません。");
      return;
    }
  
    let visualizationHTML = "";
    for (let rows of array2D) {
      for (let cell of rows) {
        if (cell === 0) {
          visualizationHTML += "□";
        } else if (cell === 1) {
          visualizationHTML += "■";
        } else {
          visualizationHTML += "?"; // 0/1以外の値の場合
        }
      }
      visualizationHTML += "<br>"; // 行末で改行
    }
  
    targetElement.innerHTML = visualizationHTML;
  }

  function extractColumns(array2D) {
    if (!array2D || array2D.length === 0 || !Array.isArray(array2D[0])) {
      return []; // 空の配列または不正な入力の場合は空の配列を返す
    }
  
    const numColumns = array2D[0].length; // 列数
    const result = [];
  
    for (let col = 0; col < numColumns; col++) {
      const column = [];
      for (let row = 0; row < array2D.length; row++) {
        if (array2D[row][col] !== undefined) {
          column.push(array2D[row][col]);
        }
      }
      result.push(column);
    }
  
    return result;
  }

  function flattenAndJoin(arr, separator) {
    return arr
      .flat(Infinity)
      .join(separator);
  }