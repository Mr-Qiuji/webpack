const path = require('path')
const fs = require('fs')

const {
  sortDependencies,
  installDependencies,
  runLintFix,
  printMessage,
} = require('./utils')
const pkg = require('./package.json')

const templateVersion = pkg.version

const { addTestAnswers } = require('./scenarios')

module.exports = {
  metalsmith: {
    // When running tests for the template, this adds answers for the selected scenario
    before: addTestAnswers
  },
  helpers: {
    if_or(v1, v2, options) {

      if (v1 || v2) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    template_version() {
      return templateVersion
    },
  },
  
  prompts: {
    name: {
      type: 'string',
      required: true,
      message: '您的项目名称',
    },
    fruit: {
      type: 'confirm',
      message: '这是一个水果吗?',
    },
    species: {
      When: 'fruit',
      type: 'list',
      message: '这是什么水果',
      choices: [{
          name: '苹果',
          value: 'apple'
        },{
          name: '香蕉',
          value: 'banana'
        },
      ],
    },
  },
  filters: {
    'fruit/**/*': 'fruit',
    'fruit/apple/**/*': "fruit && species === 'apple'",
    'fruit/banana/**/*': "fruit && species === 'banana'",
  },
  complete: function(data, { chalk }) {
    const green = chalk.green

    sortDependencies(data, green)

    const cwd = path.join(process.cwd(), data.inPlace ? '' : data.destDirName)

    if (data.autoInstall) {
      installDependencies(cwd, data.autoInstall, green)
        .then(() => {
          return runLintFix(cwd, data, green)
        })
        .then(() => {
          printMessage(data, green)
        })
        .catch(e => {
          console.log(chalk.red('Error:'), e)
        })
    } else {
      printMessage(data, chalk)
    }
  },
}
