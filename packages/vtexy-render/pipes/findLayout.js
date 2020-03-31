const fs = require('fs');
const path = require('path');
// const queryString = require('query-string');
const Url = require('url-parse');
const JSONC = require('jsonc');
const glob = require('glob');
const { LayoutSchema } = require('../../vtexy-schemas');

const getFolderName = pathTo => {
  let vf = pathTo.split(path.sep);
  vf = vf[vf.length - 1];
  vf = vf == '_' ? '/' : vf;
  return vf;
};

module.exports = async args => {
  let { request, website } = args;

  let url = new Url(request.url);

  let folder = path.join(website.path, '_', url.pathname === '/' ? '' : url.pathname);

  // Respecting path
  if (fs.existsSync(folder)) {
    let layouts = await glob.sync(path.join(folder, '!(_).jsonc'));

    layouts = await Promise.all(
      layouts.map(async file => ({
        ...(await LayoutSchema.validateSync(JSONC.parse(fs.readFileSync(file, 'utf8')))),
        file
      }))
    );

    if (layouts.filter(x => x.active && x.default).length > 1) {
      throw 'There cannot be more than one default page. ' + `(Path: ${folder})`;
    }

    let layout = layouts.find(x => x.active && x.default);

    layout.virtualFolder = getFolderName(folder);

    return {
      ...args,
      layout
    };
  }
};