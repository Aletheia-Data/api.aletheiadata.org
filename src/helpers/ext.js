exports.getExtension = ((mimeType)=>{
    let res_type;
    // check ext by headers
    switch (mimeType) {
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
            res_type = 'xlsx'
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          res_type = 'docx'
          break;
        case 'application/pdf':
            res_type = 'pdf'
            break;
        case 'text/csv':
        case 'text/x-comma-separated-values;charset=UTF-8':
        case 'text/csv; charset=Windows-1252':
        case 'application/csv':
        case 'application/octet-stream':
        case 'text/csv; charset=utf-8':
        case 'text/csv;charset=UTF-8':
            res_type = 'csv'
            break;
        case 'text/plain;charset=UTF-8':
            res_type = 'txt'
            break;
        case 'text/html;charset=UTF-8':
        case 'text/html; charset=utf-8':
            res_type = 'txt';
            break;
        case 'application/vnd.oasis.opendocument.spreadsheet':
        case 'application/oleobject':
        case 'application/ods':
        case 'text/ods; charset=utf-8':
        case 'application /vnd.openxmlformats-officedocument.wordprocessingml.document':
            res_type = 'ods'
            break;
        case 'application/json; charset=utf-8':
        case 'application/json;charset=utf-8':
        case 'application/json':
        case 'text/json; charset=utf-8':
            res_type = 'json'
            break;
        case 'image/png':
          res_type = 'png'
          break;
        case 'image/jpg':
          res_type = 'jpg'
          break;
      }

    return res_type
  });