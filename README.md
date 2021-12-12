# Easegress wasmhost 使用

# Easegress AssemblyScript SDK

## Prerequisites

The following assumes that a recent version of [Git](https://git-scm.com/), [Node.js](https://nodejs.org/) and its package manager [npm](https://www.npmjs.com/) are installed. Basic knowledge about writing and working with TypeScript modules, which is very similar, is a plus.

### Easegress编译增加wasmhost支持

```
git clone https://github.com/megaease/easegress && cd easegress
make GOTAGS=wasmhost 
```

注意此处增加了GOTAGS=wasmhost,否则在加载wasm时会报错

添加Easegress/bin到用户PATH环境变量

```
export PATH=${PATH}:$(pwd)/bin/
```

### 启动 easegress-server 

直接执行命令

```
easegress-server                                 
2021-10-12T12:30:55.601+08:00	INFO	server/main.go:57	Easegress release: v1.1.0, repo: https://github.com/megaease/easegress.git, commit: git-95b70c0
2021-12-12T12:30:55.602+08:00	INFO	cluster/config.go:125	etcd config: init-cluster:eg-default-name=http://localhost:2380 cluster-state:existing force-new-cluster:false
```



## Local Development

1. Clone this repo to somewhere on disk.
2. Switch to a new directory and initialize a new node module:
3. npm version must v14.0 or later, ubuntu install v10.0 default, so you must install new version by manul

```
npm init
```

1. Install the AssemblyScript compiler using npm, assume that the compiler is not required in production and make it a development dependency:

```
npm install --save-dev assemblyscript
```

1. Once installed, the compiler provides a handy scaffolding utility to quickly set up a new AssemblyScript project, for example in the directory of the just initialized node module:

```
npx asinit .
```

1. Add `--use abort=` to the `asc` in `package.json`, for example:

```
"asbuild:untouched": "asc assembly/index.ts --target debug --use abort=",
"asbuild:optimized": "asc assembly/index.ts --target release --use abort=",
```

1. Copy this into assembly/index.ts, note to replace `PATH_TO_SDK_REPO` with the path in the first step:

```
// As required by Easegress, these functions must be exported
export * from 'PATH_TO_SDK_REPO/easegress/proxy'

import { Program, request, LogLevel, log, registerProgramFactory } from 'PATH_TO_SDK_REPO/easegress'

class AddHeaderAndSetBody extends Program {
    constructor(params: Map<string, string>) {
        super(params)
    }

    run(): i32 {
        super.run()
        let v = request.getHeader( "Foo" )
        if( v.length > 10 ) {
            log( LogLevel.Warning, "The length of Foo is greater than 10" )
        }
        if( v.length > 0 ) {
            request.addHeader( "Wasm-Added", v )
        }
        request.setBody( String.UTF8.encode("I have a new body now") )
        return 0
    }
}

registerProgramFactory((params: Map<string, string>) => {
    return new AddHeaderAndSetBody(params)
}
```

1. Build with this command

```
npm run asbuild
```

### 启动http-server

```
echo 'kind: HTTPServer
name: http-server
port: 10080
keepAlive: true
https: false
rules:
- paths:
  - pathPrefix: /flashsale
    backend: flash-sale-pipeline' | egctl object create
```

如果使用文件

```
egctl object create -f HTTPServer.yml
```

### 启动pipline

```
echo 'name: flash-sale-pipeline
kind: HTTPPipeline
flow:
  - filter: wasm
  - filter: mock
filters:
  - name: wasm
    kind: WasmHost
    maxConcurrency: 2
    code: /home/shidf/dev/wasm-hello/build/optimized.wasm
    timeout: 100ms
  - name: mock
    kind: Mock
    rules:
      - body: "You can buy the laptop for $1 now.\n"
        code: 200' | egctl object create
```

如果使用文件

```
egctl object create -f flash-sale-pipeline.yml
```

### Test

Now you can use some HTTP clients such as `curl` to test the feature:

```
curl -v http://127.0.0.1:10080/flashsale
```

### 其他egctl命令参考

```
egctl help
A command line admin tool for Easegress.

Usage:
  egctl [command]

Examples:
  # List APIs.
  egctl api list

  # Probe health.
  egctl health

  # List member information.
  egctl member list

  # Purge a easegress member
  egctl member purge <member name>

  # List object kinds.
  egctl object kinds

  # Create an object from a yaml file.
  egctl object create -f <object_spec.yaml>

  # Create an object from stdout.
  cat <object_spec.yaml> | egctl object create

  # Delete an object.
  egctl object delete <object_name>

  # Get an object.
  egctl object get <object_name>

  # List objects.
  egctl object list

  # Update an object from a yaml file.
  egctl object update -f <new_object_spec.yaml>

  # Update an object from stdout.
  cat <new_object_spec.yaml> | egctl object update

  # list objects status
  egctl object status list

  # Get object status
  egctl object status get <object_name>


Available Commands:
  api         View Easegress APIs
  completion  Output shell completion code for the specified shell (bash or zsh)
  health      Probe Easegress health
  help        Help about any command
  member      View Easegress members
  object      View and change objects
  wasm        Manage WebAssembly code and data

Flags:
  -h, --help            help for egctl
  -o, --output string   Output format(json, yaml) (default "yaml")
      --server string   The address of the Easegress endpoint (default "localhost:2381")

Use "egctl [command] --help" for more information about a command.
```

relaod wasm

```
egctl wasm reload-code
```

you can find the code from https://github.com/megaease/easegress-assemblyscript-sdk/tree/main/examples/flashsale

help links:

https://github.com/megaease/easegress-assemblyscript-sdk

https://github.com/megaease/easegress



author help video and weixin page,but you should copy from the page, bucause page lose whitespace

https://www.youtube.com/watch?v=InPc5aIAu_o&t=1459s

https://megaease.com/zh/blog/2021/09/08/how-to-do-an-online-flash-sale-event-with-easegress-and-webassembly/

https://github.com/megaease/easegress/blob/main/doc/cookbook/flash-sale.md
