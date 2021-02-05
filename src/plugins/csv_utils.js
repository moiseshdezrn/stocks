const convertToCSV = function  (objArray, headers) {
  const array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  let str = "";
  
  for (let i = 0; i < array.length; i++) {
    let line = "";
    for (let key in headers) {
      if (line != "") line += ",";
      line += array[i][key];
    }
    str += line + "\r\n";
  }
  return str;
}

export default {
  
  install(Vue) { 
    
    Vue.prototype.$exportCSVFile = function (headers, items, fileName) {
      if (headers) {
       items.unshift(headers);
      }
      const jsonObject = JSON.stringify(items);
      const csv = convertToCSV(jsonObject, headers);
      const exportName = fileName + ".csv" || "export.csv";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
       navigator.msSaveBlob(blob, exportName);
      } else {
       const link = document.createElement("a");
       if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
       }
      }
    }
  
    
  }
}