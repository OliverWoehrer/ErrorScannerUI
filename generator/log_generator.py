from datetime import datetime
import os
import random
import secrets
import signal
import time

INTERVAL_VARIABLE = "GENERATOR_INTERVAL"
DEFAULT_INTERVAL = 5000
running = True # flag to indicate if shutdown has been requested

def random_timestamp_format() -> str:
    formats = [
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S,%f",
        "%A, %B %d, %Y %I:%M:%S %p",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%b %d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        None # use UNIX timestamp instead
    ]
    return random.choice(formats)

def random_log_format() -> str:
    formats = [
        # Basic Formats
        "{timestamp} {category} {app}: {message}",
        "{timestamp} {category} {app} - {message}",
        "{app} - {timestamp}: {category} {message}",
        "{timestamp} {category} {message}",
        "{timestamp} [{category:<8}] ({app}/{module}) {message}",
        "{timestamp} | {app} | {module} | {category} | {message}",
        "[{timestamp}] {category} {module} in {app}: {message}",
        "{app}::{module} {category} @ {timestamp} - {message}",
        "{category} {timestamp} {app} {message}",
        "{timestamp} ({app}) {category} {message}",
        "{timestamp} {app} {module} {category} {message}",
        "{timestamp} {category} ({module}) {message}",
        "{timestamp} {category} {message}",
        "{category} {message}",
        "{category} {app} {message}",
        "{category} {module}: {message}",
        "{timestamp} {category} {app} {module} - {message}"
    ]
    return random.choice(formats)

def random_app() -> str:
    names = [
        "WebAppFrontend",
        "BackendAPI",
        "AuthService",
        "PaymentGateway",
        "AnalyticsEngine",
        "NotificationService",
        "DataProcessor",
        "UserManagement",
        "ReportingTool",
        "ImageProcessor"
    ]
    return random.choice(names)

def random_module() -> str:
    names = [
        "database_connector",
        "auth_middleware",
        "logging_utils",
        "config_loader",
        "request_handler",
        "data_validator",
        "email_sender",
        "file_io",
        "cache_manager",
        "report_generator"
    ]
    return random.choice(names)

def random_log_level() -> str:
    levels =  [
        "INFO",
        "DEBUG",
        "WARNING",
        "ERROR",
        "CRITICAL"
    ]
    return random.choice(levels)

def random_message(log_level: str = "INFO") -> str:
    # Generate Random Data:
    random_data = {
        'user': f"user_{random.randint(100, 999)}",
        'ip_address': f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
        'service_name': random.choice(["AuthService", "ProductCatalog", "OrderProcessor", "PaymentGateway", "AnalyticsEngine"]),
        'records_processed': random.randint(100, 5000),
        'version': f"{random.randint(1,5)}.{random.randint(0,9)}.{random.randint(0,9)}",
        'profile': random.choice(["production", "staging", "development"]),
        'url': random.choice(["/api/v1/products", "/dashboard", "/checkout", "/login", "/reports", "/items/123", "/search"]),
        'duration': random.uniform(5.0, 500.0),
        'status_code': random.choice([200, 201, 204, 400, 401, 403, 404, 500, 502, 503]),
        'job_id': f"JOB-{secrets.token_hex(5)}",
        'resource': random.choice(['user_account', 'product_entry', 'order_id']),
        'cpu_usage': random.uniform(10.0, 99.0),
        'mem_usage': random.uniform(20.0, 95.0),
        'var_name': random.choice(["userId", "itemCount", "apiUrl", "config_value", "session_token"]),
        'value': random.choice([random.randint(0,1000), random.uniform(0.0, 100.0), True, False, "some_string_data"]),
        'func_name': random.choice(["processRequest", "saveToDB", "calculateSum", "validateInput", "sendNotification"]),
        'args': f"{{\"id\": {random.randint(1, 100)}, \"param\": \"{random.choice(['valueA', 'valueB'])}\"}}", # String for easier formatting
        'query': f"SELECT * FROM {random.choice(['users', 'products', 'orders'])} WHERE id = '{random.randint(1,100)}';",
        'key': random.choice(["user:123", "product:abc", "config:main", "cache_entry_xyz"]),
        'result_data': f"{{\"count\": {random.randint(1, 50)}, \"status\": \"success\"}}", # String for easier formatting
        'db_host': f"db-{random.randint(1,3)}.example.com",
        'db_port': random.randint(5000, 9000),
        'payload_size': random.randint(100, 10000),
        'source_ip': f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
        'resource_name': random.choice(['config_lock', 'db_access', 'file_write']),
        'volume': random.choice(["/dev/sda1", "/data", "/var/log", "/mnt/backup"]),
        'free_space': random.randint(1, 20),
        'api_endpoint': random.choice(["/users", "/products/search", "/payments/process", "/health"]),
        'error_message': random.choice(["Invalid parameter", "Resource limit exceeded", "Service unavailable", "Malformed request body"]),
        'feature': random.choice(["legacy_api", "old_auth_method", "unsupported_protocol"]),
        'domain': random.choice(["example.com", "api.example.org", "auth.example.net", "test.internal"]),
        'days_left': random.randint(1, 30),
        'operation': random.choice(['file_upload', 'data_fetch', 'report_generation']),
        'exception_type': random.choice(["NullPointerException", "IndexOutOfBoundsException", "NetworkError", "DatabaseConnectionError", "FileNotFoundException", "PermissionDeniedError"]),
        'exception_message': random.choice([
            "Object reference not set to an instance of an object.",
            "Array index out of bounds: 10.",
            "Connection timed out after 30 seconds.",
            "Access denied for user 'guest'.",
            "No such file or directory: '/app/data/temp.txt'."
        ]),
        'module': random.choice(["api_handler", "data_processor", "user_service", "report_generator"]),
        'response_body': "{\"error\":\"invalid_request\"}" if random.random() > 0.5 else "null",
        'file_path': random.choice(["/var/log/app.log", "/etc/config.yaml", "/tmp/data.csv", "/srv/app/index.html"]),
        'node_id': f"node-{random.randint(1,5)}",
        'field_name': random.choice(['email', 'password', 'item_id']),
        'invalid_value': random.choice(['"malicious_input"', "123a", "null"]),
        'config_file': random.choice(['app_config.ini', 'security.json']),
        'parse_error': random.choice(['JSON syntax error', 'YAML parsing failed', 'Missing section']),
        'host_name': f"server-{random.randint(1, 10)}.example.com",
        'trace_id': f"TRC-{secrets.token_hex(16)}",
        'span_id': f"SPN-{secrets.token_hex(8)}",
        'thread_id': f"thread-{random.randint(1, 50)}",
        'process_id': random.randint(1000, 9999),
        'app_name': random.choice(["syslog-app", "kernel", "httpd", "sshd", "docker", "cron"]),
        'proc_id': f"{random.randint(1, 1000)}",
        'msg_id': f"ID{random.randint(1,999)}",
        'event_type': random.choice(['start', 'stop', 'config_change', 'login_attempt', 'data_transfer']),
        'event_code': random.randint(100, 999),
        'component': random.choice(['frontend', 'backend', 'db', 'cache', 'queue', 'middleware']),
        'request_id': f"REQ-{secrets.token_hex(6)}",
        # Handle random_error_type generation directly
        'error_type': (lambda exc_type: exc_type.replace('Exception', 'Error') if 'Exception' in exc_type else exc_type + "Error")(
            random.choice(["NullPointerException", "IndexOutOfBoundsException", "NetworkError", "DatabaseConnectionError", "FileNotFoundException", "PermissionDeniedError"])
        ),
        'source_file': random.choice(['service.py', 'handler.go', 'main.js', 'controller.java']),
        'line': random.randint(1, 500),
        'impact': random.choice(["System wide", "Partial service degradation", "User specific", "No impact"]),
        'remediation': random.choice(["Immediate human intervention required", "Automated retry in 5s", "Investigation needed", "Restart service"]),
        'node_affected': f"node-{random.randint(1,5)}"  # Used in XML format, directly using node_id generation logic
    }

    # Generate Random Message (based on log level):
    if log_level == "INFO":
        templates = [
            "User '{user}' logged in successfully from {ip_address}.",
            "Data synchronization complete for service '{service_name}'. {records_processed} records processed.",
            "Application initialized. Version {version}.",
            "Configuration reloaded. Active profile: {profile}.",
            "Request for {url} processed in {duration:.2f}ms. Status: {status_code}.",
            "Batch job '{job_id}' started.",
            "Resource '{resource}' allocated successfully for user '{user}'.",
            "Metrics collected: CPU={cpu_usage:.1f}%, Mem={mem_usage:.1f}%."
        ]
    elif log_level == "DEBUG":
        templates = [
            "Debugging variable '{var_name}': value is {value}.",
            "Function '{func_name}' entered. Arguments: {args}.",
            "Database query executed: '{query}'.",
            "Caching mechanism hit for key '{key}'.",
            "Intermediate result: {result_data}.",
            "Checking network connectivity to {db_host}:{db_port}.",
            "Received payload: {payload_size} bytes from {source_ip}.",
            "Attempting to acquire lock for resource '{resource_name}'."
        ]
    elif log_level == "WARNING":
        templates = [
            "Low disk space detected on volume '{volume}'. Free: {free_space}GB.",
            "API endpoint '{api_endpoint}' returned non-critical error: {error_message}.",
            "Deprecated feature '{feature}' used by user '{user}'.",
            "Unusual activity detected from IP {ip_address}. Monitoring.",
            "Certificate for '{domain}' expiring soon (in {days_left} days).",
            "Operation '{operation}' took longer than expected: {duration:.2f}ms.",
            "Potential SQL injection attempt detected from {ip_address}."
        ]
    elif log_level == "ERROR":
        templates = [
            "Failed to connect to database. Host: {db_host}, Port: {db_port}. Error: {error_details}.",
            "Unhandled exception in module '{module}'. {exception_type}: {exception_message}.",
            "API request to '{api_endpoint}' failed with status {status_code}. Response: '{response_body}'.",
            "File '{file_path}' not found or inaccessible.",
            "Authentication failed for user '{user}'. Incorrect credentials.",
            "Service '{service_name}' became unresponsive. Attempting restart.",
            "Traceback (most recent call last):\n" \
            "  File \"/usr/src/app/{source_file}\", line {line}, in {func_name}\n" \
            "    result = some_function_call(data)\n" \
            "  File \"/usr/src/app/utils/helpers.py\", line {line}, in some_function_call\n" \
            "    return another_function(data)\n" \
            "{exception_type}: {exception_message}",
            "ERROR: Unhandled exception caught at {func_name}.\n" \
            "  Request ID: {request_id}\n" \
            "  Component: {component}\n" \
            "  Host: {host_name}\n" \
            "  Exception details: {exception_type} - {exception_message}\n" \
            "  Impact: {impact}\n" \
            "  Remediation: {remediation}"
        ]
    elif log_level == "CRITICAL":
        templates = [
            "System critical error: Out of memory. Emergency shutdown initiated.",
            "Primary database connection lost. All services affected.",
            "Security breach detected. Unauthorized access from {ip_address}. System locked down.",
            "Cluster node '{node_id}' failed. Failover in progress.",
            "Critical service '{service_name}' crashed unexpectedly. System instability likely.",
            "CRITICAL: System-wide failure detected on node '{node_id}'.\n" \
            "  Event ID: {event_code}\n" \
            "  Timestamp: {timestamp}\n" \
            "  Source: {app_name}\n" \
            "  Details: Service '{service_name}' is unresponsive. Possible deadlock or resource starvation.\n" \
            "  Affected components: {component}",
            "--- Begin Core Dump ---\n" \
            "Time: {timestamp}\n" \
            "Node: {host_name}\n" \
            "Process ID: {process_id} ({app_name})\n" \
            "Thread ID: {thread_id}\n" \
            "Reason: {error_type} occurred in {module} during {operation}.\n" \
            "Memory state at failure: {mem_usage}% used.\n" \
            "--- End Core Dump ---"
        ]
    else:
        templates= [
            "Unknown error"
        ]
    
    # Fill Meesage Template With Random Data:
    try:
        template = random.choice(templates)
        return template.format_map(random_data)
    except KeyError as e:
        return f"KeyError: {e}"

def signal_handler(signum, frame):
    global running
    running = False

if __name__ == "__main__":
    interval = os.environ.get(INTERVAL_VARIABLE)
    if interval:
        interval = int(interval)
    else:
        print(f"Could not find '{INTERVAL_VARIABLE}'. Using default interval {DEFAULT_INTERVAL} instead")
        interval = DEFAULT_INTERVAL

    try:
        # Register the SIGTERM handler
        signal.signal(signal.SIGTERM, signal_handler)

        TIMESTAMP_FORMAT = random_timestamp_format()
        LOG_FORMAT = random_log_format()
        print(f"Log Generator: Press Ctrl+C to stop.")
        while running:
            # Add a random delay
            var = interval * 0.3
            delay = random.uniform(interval-var, interval+var) / 1000 # delay in seconds
            time.sleep(delay)
            
            # Random Data:
            app = random_app()
            module = random_module()
            log_level = random_log_level()
            message = random_message(log_level)

            # Timestamp:
            if TIMESTAMP_FORMAT:
                timestamp = datetime.now().strftime(TIMESTAMP_FORMAT) # formated timestamp
            else:
                timestamp = (datetime.now() - datetime(1970, 1, 1)).total_seconds() # unix timestamp
    
            # Print Log:
            cetegory_tag = "["+log_level+"]"
            log = LOG_FORMAT.format(app=app, module=module, category=cetegory_tag, message=message, timestamp=timestamp)
            print(log)

    except KeyboardInterrupt:
        print("Bye!")
    except InterruptedError:
        print("Terminated!")
    else:
        print("Shutdown!")