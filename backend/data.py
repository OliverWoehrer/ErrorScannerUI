import json
from typing import List, Dict, Any, Optional
from collections import deque # Import deque for efficient log tailing

# Define the structure for a single log message
LogMessage = Dict[str, Any]

def write_logs(filename: str, logs: List[LogMessage]) -> None:
    """
    Writes a batch of log messages to a JSON Lines (JSONL) file.

    Each log dictionary is serialized to JSON and written as a new line.
    This uses 'a' (append) mode, making the write operation fast and
    independent of the file size (which solves the scalability issue).

    Args:
        filename: The path to the JSONL file.
        logs: A list of log dictionaries to be written (your batch).
    """
    try:
        # Open the file in append mode ('a')
        with open(filename, 'a', encoding='utf-8') as f:
            for log in logs:
                # 1. Serialize the dictionary to a JSON string
                json_line = json.dumps(log)
                # 2. Write the string, followed by a newline.
                f.write(json_line + '\n')
        print(f"Successfully wrote {len(logs)} logs to {filename} (appended).")
    except IOError as e:
        print(f"Error writing to file {filename}: {e}")
    except TypeError as e:
        print(f"Error serializing log data (check for un-serializable objects): {e}")

def read_logs(filename: str, num_lines: Optional[int] = None) -> List[LogMessage]:
    """
    Reads log messages from a JSON Lines (JSONL) file.

    If num_lines is provided, only the last N lines are read (tailing).
    This is done efficiently using deque to avoid loading the entire file
    into memory if it's very large.

    Args:
        filename: The path to the JSONL file.
        num_lines: Optional integer specifying the maximum number of lines
                   to read from the end of the file. If None or 0, all
                   lines are read.

    Returns:
        A list of log dictionaries read from the file.
    """
    logs: List[LogMessage] = []
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            
            # Determine which lines to process
            if num_lines is not None and num_lines > 0:
                # Use deque to efficiently read only the last N lines.
                # This iterates through the whole file but only stores the
                # last N lines in memory.
                file_lines = deque(f, maxlen=num_lines)
            else:
                # Read all lines
                file_lines = f.readlines()
            
            # Iterate and parse the selected lines
            for line in file_lines:
                # Strip leading/trailing whitespace (like the newline character)
                stripped_line = line.strip()
                if stripped_line:
                    try:
                        # Parse the JSON string back into a dictionary
                        log_entry = json.loads(stripped_line)
                        logs.append(log_entry)
                    except json.JSONDecodeError as e:
                        # Handle case where a line is not valid JSON
                        print(f"Skipping corrupted line in {filename}: {e} (Content snippet: '{stripped_line[:50]}...')")
                        continue
                        
    except FileNotFoundError:
        print(f"The file {filename} does not exist. Returning empty list.")
    except IOError as e:
        print(f"Error reading file {filename}: {e}")

    return logs