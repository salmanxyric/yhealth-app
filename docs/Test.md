Recommended commands for the first implementation pass:

npm.cmd --prefix server run typecheck
npm.cmd --prefix server run lint
npm.cmd --prefix server run test:unit
npm.cmd --prefix server run test:integration
npm.cmd --prefix client run lint
npm.cmd --prefix client run test
npm.cmd --prefix client run build