// tmux docs:
// https://tao-of-tmux.readthedocs.io/en/latest/manuscript/10-scripting.html#controlling-tmux-send-keys
// https://coderwall.com/p/rkstvg/clear-pane-in-tmux
// https://github.com/elixir-lang/elixir/blob/main/lib/iex/lib/iex/helpers.ex
//
//  tmux send-keys -- 'Mix.Tasks.Test.run([])' Enter
// MIX_ENV=test iex -S mix


exports.activate = function() {
  last_test = null
}

exports.deactivate = function() {
}

nova.commands.register("elixir-actions.run-this-test", (workspace) => {
  const editor = workspace.activeTextEditor

  if (editor) {
    const text = editor.document.getTextInRange(new Range(0, editor.document.length))
    const cursorPosition = editor.selectedRange.start
    const lines = text.slice(0, cursorPosition).split('\n')
    const line = lines.length
    const path = nova.workspace.relativizePath(editor.document.path)

    run_test(`${path}:${line}`)
  }
})

nova.commands.register("elixir-actions.run-this-test-file", (workspace) => {
  const path = relativePath(workspace)

  if (path) {
    run_test(path)
  }
})

nova.commands.register("elixir-actions.rerun-tests", (workspace) => {
  if (last_test) {
    tmux(`mix test ${last_test}`)
  }
})

nova.commands.register("elixir-actions.run-all-tests", (workspace) => {
  tmux("mix test")
})

nova.commands.register("elixir-actions.run-stale-tests-first-failure", (workspace) => {
  tmux("mix test --stale --max-failures 1 --seed 0")
})

nova.commands.register("elixir-actions.run-stale-tests", (workspace) => {
  tmux("mix test --stale")
})

nova.commands.register("elixir-actions.docs", (workspace) => {
  const editor = workspace.activeTextEditor

  if (editor) {
    const cursorPosition = editor.selectedRange.start + 2
    // const symbol = editor.symbolAtPosition(cursorPosition)
    const symbols = editor.symbolsForSelectedRanges()
    console.log(`symbols: ${symbols}`)
    symbols.forEach(symbol => {
    console.log(`symbol.type: ${symbol.type}`)
    console.log(`symbol.name: ${symbol.name}`)
    console.log(`symbol.displayName: ${symbol.displayName}`)
    console.log(`symbol.comment: ${symbol.comment}`)
    console.log(`symbol.parent: ${symbol.parent}`)
    console.log(`symbol.range: ${symbol.range}`)
    console.log(`symbol.nameRange: ${symbol.nameRange}`)
    })
  }
  // tmux("mix test --stale")
})

// // //

function elixir(command) {
  tmux(`elixir -e "${command}"`)
}

function help(module) {
  elixir(`IEx.Introspection.h(${module})`)
}

function run_test(path) {
  last_test = path
  tmux(`mix test ${path}`)
}

function relativePath(workspace) {
  if (workspace.activeTextEditor) {
    return workspace.relativizePath(workspace.activeTextEditor.document.path)
  } else {
    return nil
  }
}

function tmux(command) {
  const tmux_path = nova.config.get("elixir-actions.tmux-path")
  const shell = nova.config.get("elixir-actions.shell")

  var process = new Process("noglob", { args: [tmux_path, "send-keys", command, "Enter"], shell: shell })

  var stdout = []
  var stderr = []

  process.onStdout(function(data) {
    if (data) {
      stdout.push(data)
    }
  })

  process.onStderr(function(data) {
    if (data) {
      stderr.push(data)
    }
  })

  process.onDidExit(function(status) {
    // var string = "External Tool Exited with Stdout:\n" + stdout.join("")
    console.log(`exit status: ${status}`)
    console.log(`stdout: ${stdout.join("")}`)
    console.log(`stderr: ${stderr.join("")}`)
    // nova.workspace.showInformativeMessage(string)
  })

  process.start()
}
