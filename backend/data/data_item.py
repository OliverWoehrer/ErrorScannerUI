from datetime import datetime
from difflib import SequenceMatcher
import re

class DataItem:
    def __init__(self, timestamp: datetime = None, category: str = None, source : str = None, message: str = None, solution: str = None, searchkey: str = None, id: str = None):
        assert (not timestamp) or isinstance(timestamp, datetime), "'timestamp' has to by of time 'datetime'"
        self.timestamp = timestamp or datetime.now() # use current date as fallback
        self.category = category or "debug"
        self.source = source or ""
        self.message = message or ""
        self.solution = solution
        self.searchkey = searchkey or ""
        if id:
            self.id = id
        else: # use unsigned hash in HEX as ID if non given
            signed_hash = hash((self.timestamp,self.category,self.source,self.message,self.searchkey))
            masked = signed_hash & 0xFFFFFFFFFFFFFFFF # 64 bit mask
            self.id = f"{masked:016X}"

    def similarity_score(self, other) -> float:
        """
        Log items are considered similar if they are similar but not necessariliy the same. First
        they need to share their category and source. After that, the searchkey(s) are checked, if
        available. If no searchkeys are available, we compare how similar both messages are. If the
        similarity ratio is above the threshold, the messages are considered to be euqal.
        
        The searchkey was added by the human user and can be used to reliable search for in the
        'other' object's message. If a part of the 'other' message matched the searchkey of 'self'
        or vice versa, they are considered euqal. Assuming they have the same category and source!
    
        We need to compare the message text of 'self' with the message text of 'other', by aligning
        tokens using SequenceMatcher to find the longest static blocks (the skeleton). Any log
        message has static template blocks that are the same everytime and variable blocks that
        change with each error (e.g. timestamps, error message about user input, length of data).
        If the ratio of static tokens to total tokens is hight enough, the logs are considered
        euqal.
        """
        if not isinstance(other, DataItem):
            return NotImplemented
        
        # Check Category and Source:
        if self.category != other.category:
            return 0.0
        if self.source != other.source:
            return 0.0
        
        # Check For Perfect Matching Messages:
        if self.message == other.message:
            return 1.0

        # Check With Searchkey:
        if self.searchkey:
            return self.searchkey in other.message # check is searchkey is part of other message
        if other.searchkey: # implement symmetry behavior
            return other.searchkey in self.message # check is searchkey is part of self message

        # Extract Tokens from Message Text:
        tokens1 = self._tokenize()
        tokens2 = other._tokenize()

        # Calculate Similarity Ratio:
        matcher = SequenceMatcher(None, tokens1, tokens2) 
        ratio = matcher.ratio() # gives the best measure of similarity

        if False: # debug
            # [INFO]
            # SequenceMatcher
            # Opcode format: (tag, start1, stop1, start2, stop2)
            # tag: 'equal', 'replace', 'insert', 'delete'
            # start1:stop2 are indices in tokens1, start2:stop2 are indices in tokens2
            PLACEHOLDER = "PLACEHOLDER"
            skeleton_tokens = []
            for tag, start1, stop1, start2, stop2 in matcher.get_opcodes():
                if tag == "equal": # static matching block, use tokens from the first log
                    skeleton_tokens.extend(tokens1[start1:stop1])
                elif tag in ('replace', 'insert', 'delete'): # variable block, add the placeholder
                    if not skeleton_tokens or skeleton_tokens[-1] != PLACEHOLDER:
                        skeleton_tokens.append(PLACEHOLDER)
                # Note: 'insert' and 'delete' would mean the logs have different numbers
                # of tokens, but they still represent a variable section in the skeleton.
            skeleton_string = " ".join(skeleton_tokens).strip() # reconstruct skeleton template
            print(f"Skeleton: {skeleton_string}\r\n")
        
        return ratio

    def _tokenize(self) -> list[str]:
        """
        Splits the log message into tokens (words, numbers, and key punctuation) while preserving
        the order. This regex splits by any sequence of non-word/non-digit/non-space characters OR
        by spaces, but keeps the non-word/non-digit/non-space characters as tokens. It ensures that
        ':', '/', and '.' are separate tokens, which improves alignment.
        """
        return [token for token in re.split(r"(\s+)|([^\w\s]+)", self.message) if token and token.strip()]        
    
    # [INFO]
    # The methods __eq__ and __hash__ have to follow the Hash-Equality-Contract: If two objects are
    # considered equal (__eq__ returns True), they have to produce the same hash (same return value
    # for __hash__).
    # Two DataItem objects are equal, if the most important properties (category, source and
    # searchkey) are equal and if their log messages are similar (but not nessecarily equal). Two
    # equal objects (__eq__ is True) have different hashes, if we consider the message for the
    # computation of their hash, because their messages are only similar but not equal. This
    # means messages cannot be use for the hash, because two equal objects would NOT produce the
    # same hash!
    # If we do not use the message in __hash__, but only category, source and searchkey, the hash
    # function is very weak because many items share these properties. The savest way to solve this
    # problem is to make DataItem not hashable. This means it cannot be used in hash-based
    # data structures (dict or set). It can still be used in list comparisons, which is enough for
    # this usecase.
    
    def __str__(self):
        dictionary = str(self.__dict__) # export to dict and convert to string
        return f"#ID {self.id} \"{self.message[:100]}...\""

    @staticmethod
    def serialize(obj) -> dict:
        if not obj:
            raise TypeError(f"Could not serialize item is 'None'.")
        if not isinstance(obj, DataItem):
            raise TypeError(f"Item has to be of type 'DataItem'.")
        try:
            serialized = dict(obj.__dict__) # shallow copy to dict
            assert isinstance(obj.timestamp, datetime), "Property 'timestamp' has to be of type 'datetime'"
            serialized["timestamp"] = obj.timestamp.strftime("%Y-%m-%dT%H:%M:%S.%fZ") # format YYYY-MM-DDThh:mm:ss.ssssssZ
            return serialized # replaced 'null' values of non-default types
        except Exception as e:
            raise TypeError(f"Could not serialize item {obj.id}: {e}.")

    @staticmethod
    def parse(input: dict) -> dict:
        if not input:
            raise TypeError("Could not parse 'None'")

        # Parse Mandatory Properties:
        if "timestamp" not in input:
            raise TypeError(f"Could not parse 'timestamp' from {input}.")
        timestamp = None
        try: 
            timestamp = datetime.fromisoformat(input["timestamp"]) # parse timestamp
        except ValueError as e:
            raise TypeError(f"Invalid timestamp string '{input["timestamp"]}'. {e}")
        if "category" not in input:
            raise TypeError(f"Could not parse 'category' from {input}.")
        category = input["category"]
        if "source" not in input:
            raise TypeError(f"Could not parse 'source' from {input}.")
        source = input["source"]
        if "id" not in input:
            raise TypeError(f"Could not parse 'id' from {input}.")
        id = input["id"]

        # Try to Parse Optional Properties:
        message = input.get("message",None)
        solution = input.get("solution",None)
        searchkey = input.get("searchkey",None)
        
        # Create New Data Item:
        return DataItem(timestamp,category,source,message,solution,searchkey,id)
