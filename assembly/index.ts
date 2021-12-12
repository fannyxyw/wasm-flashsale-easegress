// As required by Easegress, these functions must be exported
export * from '../../easegress-assemblyscript-sdk/easegress/proxy'

import { Program, request, LogLevel, log, registerProgramFactory } from '../../easegress-assemblyscript-sdk/easegress'

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
})