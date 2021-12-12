// As required by Easegress, these functions must be exported
export * from '../../easegress-assemblyscript-sdk/easegress/proxy'

import { Program, log,LogLevel, request, parseDate, response, cluster, getUnixTimeInMs, rand, registerProgramFactory} from '../../easegress-assemblyscript-sdk/easegress'

class FlashSale extends Program {
  startTime: i64
  endTime: i64
  blockRatio: f64
  // maxPermission is the upper limits of permitted users 
  maxPermission: i32
  constructor(params: Map<string, string>) {
    super(params)
    let key = "startTime"
    if (params.has(key)) {
      let val = params.get(key)
      this.startTime = parseDate(val).getTime()
    }

    this.startTime = parseDate("2021-12-08T00:00:00+00:00").getTime()
    this.endTime = parseDate("2021-12-12T00:00:00+00:00").getTime()
    this.blockRatio = 0.4
    this.maxPermission = 3
  }
  run(): i32 {
    if (getUnixTimeInMs() < this.startTime) {
      response.setBody(String.UTF8.encode("not start yet.\n"))
      return 1
    }

    if (getUnixTimeInMs() > this.endTime) {
      response.setBody(String.UTF8.encode("end yet.\n"))
      log(LogLevel.Warning, "sale end yet") // will output in easegress-server log
      return 1
    }

    let id = request.getHeader("Authorization")
    if (cluster.getString("id/" + id) == "true") {
      return 0
    }
    // check the count of identifiers to see if we have reached the upper limit
    if (cluster.countKey("id/") < this.maxPermission) {
      if (rand() > this.blockRatio) {
        cluster.putString("id/" + id, "true")
        return 0
      }
    }
    response.setBody(String.UTF8.encode("sold out.\n"))
    return 2
  }
}
registerProgramFactory((params: Map<string, string>) => {
  return new FlashSale(params)
})