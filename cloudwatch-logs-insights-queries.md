# CloudWatch Logs Insights Queries for College Safe Serverless

## 1. Find All Errors Across Lambda Functions
```
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

## 2. Lambda Cold Starts Detection
```
fields @timestamp, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| filter @duration > 3000
| stats count() as coldStarts by bin(5m)
```

## 3. API Response Time Analysis
```
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration) as avgDuration,
        min(@duration) as minDuration,
        max(@duration) as maxDuration,
        pct(@duration, 50) as p50,
        pct(@duration, 95) as p95,
        pct(@duration, 99) as p99
| sort @timestamp desc
```

## 4. Memory Usage Optimization
```
fields @timestamp, @memorySize, @maxMemoryUsed, @duration
| filter @type = "REPORT"
| stats avg(@maxMemoryUsed/@memorySize*100) as avgMemoryUtilization,
        max(@maxMemoryUsed/@memorySize*100) as maxMemoryUtilization
by bin(5m)
```

## 5. Failed Authentication Attempts
```
fields @timestamp, @message
| filter @message like /authentication failed/
    or @message like /unauthorized/
    or @message like /401/
| stats count() as failedAttempts by bin(5m)
```

## 6. Database Connection Errors
```
fields @timestamp, @message, @logStream
| filter @message like /database/
    and (@message like /error/ or @message like /timeout/ or @message like /connection/)
| sort @timestamp desc
| limit 50
```

## 7. Top Error Messages
```
fields @message
| filter @message like /ERROR/
| stats count() as errorCount by @message
| sort errorCount desc
| limit 10
```

## 8. Request Tracing by X-Ray Trace ID
```
fields @timestamp, @message, @requestId, @xrayTraceId
| filter @xrayTraceId = "1-5f1e8a5d-1234567890abcdef"
| sort @timestamp asc
```

## 9. Concurrent Executions Analysis
```
fields @timestamp, @logStream
| filter @type = "START"
| stats count() as concurrentExecutions by bin(1m)
| sort @timestamp desc
```

## 10. Cost Analysis - Billed Duration
```
fields @timestamp, @billedDuration, @memorySize
| filter @type = "REPORT"
| stats sum(@billedDuration * @memorySize / 1024 / 1024) as gbSeconds,
        count() as invocations
by bin(1h)
```

## 11. Timeout Errors Detection
```
fields @timestamp, @message, @duration, @logStream
| filter @message like /Task timed out/
    or (@type = "REPORT" and @duration >= 29000)
| sort @timestamp desc
```

## 12. API Endpoint Performance
```
fields @timestamp, @message
| parse @message /Path: (?<path>.*?) /
| filter ispresent(path)
| stats count() as requests,
        avg(@duration) as avgDuration
by path
| sort requests desc
```

## Usage Instructions:
1. Go to CloudWatch Console
2. Navigate to Logs > Logs Insights
3. Select the log groups starting with `/aws/lambda/college-safe-serverless-`
4. Copy and paste any of the above queries
5. Adjust the time range as needed
6. Click "Run query"
