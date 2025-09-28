type ExampleTM = {
  name: string,
  code: string,
}

export const ExampleTMs : ExampleTM[] = [];

export const CheckEven: ExampleTM = {
  name: 'CheckEven',
  code:
    "# Checks if the number of 1's in the input \n" +
    "# (consisting of 0's and 1's) is even\n" +
    "input: '101100001100000111000000000011111'\n" +
    "blank: ' '\n" +
    'tapes: 1 \n' +
    'startstate: even\n' +
    'table:\n' +
    '    even: \n' +
    "        '1': {'R': odd}\n" +
    "        '0': 'R'\n" +
    "        ' ': {'S': accept}\n" +
    '    odd:\n' +
    "        '1': {'R': even}\n" +
    "        '0': 'R'\n" +
    "        ' ': {'S': reject}\n" +
    '    accept: {}\n' +
    '    reject: {}',
};

export const GCD: ExampleTM = {
  name: 'GCD',
  code:
    '# Computes the GCD of two numbers in unary\n' +
    'tapes: 4\n' +
    'input: "000000#0000///"   # Example input: 6 and 2 in unary ("000000" and "000")\n' +
    'blank: " "\n' +
    'startstate: copy_first\n' +
    'table:\n' +
    '  copy_first:\n' +
    "    '0/ / / ': {write: \"same/0/same/same\", 'R/R/S/S'}\n" +
    '    \'#/ / / \': {"R/S/S/S": copy_second}\n' +
    '  copy_second: \n' +
    '    \'0/ / / \': {write: "same/same/0/same", "R/S/R/S"}\n' +
    '    \' / / / \': {"L/L/L/S": move_to_begin}\n' +
    '  move_to_begin: \n' +
    '    \'[0/0/0/ , #/0/0/ ]\': "L/L/L/S"\n' +
    '    \'[0/0/ / , #/0/ / ]\': "L/L/S/S"\n' +
    '    \'[0/ / / , #/ / / ]\': "L/S/S/S"\n' +
    '    \'[0/ /0/ , #/ /0/ ]\': "L/S/L/S"\n' +
    '    \' /0/ / \': "S/L/S/S"\n' +
    '    \' / /0/ \': "S/S/L/S"\n' +
    '    \' / / / \': {"R/R/R/S": euclid}\n' +
    '  euclid:\n' +
    '    \'all/0/0/ \': "S/R/R/S"\n' +
    '    \'all/ /0/ \': {"S/L/R/S": firstsmaller_goright}\n' +
    '    \'all/0/ / \': {"S/R/L/S": secondsmaller_goright}\n' +
    '    \'all/ / / \': {"S/L/L/S": copy_result}\n' +
    '  firstsmaller_goright: \n' +
    '    \'all/0/0/ \': "S/S/R/S"\n' +
    '    \'all/0/ / \': {"S/S/L/S": firstsmaller_substract}\n' +
    '  secondsmaller_goright: \n' +
    '    \'all/0/0/ \': "S/R/S/S"\n' +
    '    \'all/ /0/ \': {"S/L/S/S": secondsmaller_substract}\n' +
    '  firstsmaller_substract:\n' +
    '    \'all/0/0/ \': {"S/L/L/S", write: "same/0/ / "}\n' +
    '    \'all/ /0/ \': {"S/S/S/S": move_to_begin}\n' +
    '  secondsmaller_substract:\n' +
    '    \'all/0/0/ \': {"S/L/L/S", write: "same/ /0/ "}\n' +
    '    \'all/0/ / \': {"S/S/S/S": move_to_begin}\n' +
    '  copy_result: \n' +
    '    \'all/0/0/ \': {"S/L/L/R", write: "same/same/same/0"}\n' +
    '    \'all/ / / \': {"S/R/R/L": finish_up}\n' +
    '  finish_up: \n' +
    '    \'all/all/all/0\': "S/S/S/L"\n' +
    '    \'all/all/all/ \': {"S/S/S/R": accept}\n' +
    '  accept: {}\n',
};

export const AllStrings: ExampleTM = {
  name: 'AllStrings',
  code:
    "#Generating all possible strings of given length, consisting of 0's and 1's\n" +
    'tapes: 1\n' +
    'input: "000"  #length 3 \n' +
    'blank: " "\n' +
    'startstate: generate\n' +
    'table:\n' +
    '    generate: \n' +
    '        "0": [{write: "0", "R"}, {write: "1", "R"}]\n' +
    '        " ": {"S": done}\n' +
    '    done: {}',
};

export const SelfLoops: ExampleTM = {
  name: 'Self Loops',
  code:
    '# Generating Graph with Self Loops\n' +
    "input: '000000' #length 6\n" +
    "blank: ' '\n" +
    'tapes: 1 \n' +
    'startstate: go\n' +
    'table:\n' +
    '    go: \n' +
    '        \'0\': ["R", "S"]\n' +
    '        \' \': {"S": done}\n' +
    '    done: {}',
};

export const DAG: ExampleTM = {
  name: 'DAG',
  code:
    '# Computing a config graph that is a DAG\n' +
    "input: '000000' #length 6\n" +
    "blank: ' '\n" +
    'tapes: 1 \n' +
    'startstate: go\n' +
    'table:\n' +
    '    go: \n' +
    '        \'0\': ["R", {"S": goright}]\n' +
    '        \' \': {"S": done}\n' +
    '    goright: \n' +
    '        \'0\': {"R": go}\n' +
    '    done: {}',
};

export const Circle: ExampleTM = {
  name: 'Circle',
  code:
    '# Creates a Configgraph that is a circle\n' +
    "input: '0'\n" +
    "blank: ' '\n" +
    'tapes: 1 \n' +
    'startstate: goright\n' +
    'table:\n' +
    '    goright: \n' +
    '        "0": "R"\n' +
    '        " ": {"L": goleft}\n' +
    '    goleft:\n' +
    '        "0": "L"\n' +
    '        " ": {"R": goright}',
};

export const BinaryAdd: ExampleTM = {
  name: 'BinaryAdd',
  code:
    '# Binary Addition on 2 tapes with output on 3rd\n' +
    "input: '111010/1111'\n" +
    "blank: ' '\n" +
    'tapes: 3 \n' +
    'startstate: goright\n' +
    'table:\n' +
    '    goright:\n' +
    '        \'[1/1/all, 1/0/all, 0/1/all, 0/0/all]\': "R/R/S"\n' +
    '        \'[1/ /all, 0/ /all]\': "R/S/S"\n' +
    '        \'[ /1/all,  /0/all]\': "S/R/S"\n' +
    '        \' / /all\': {"L/L/S": add}\n' +
    '    add:\n' +
    "        '1/1/all': {write: 'same/same/0', \"L/L/L\": carry} \n" +
    "        '[1/0/all, 0/1/all, 1/ /all,  /1/all]': {write: 'same/same/1', \"L/L/L\": add} \n" +
    "        '[0/0/all, 0/ /all,  /0/all]': {write: 'same/same/0', \"L/L/L\": add}\n" +
    '    carry:\n' +
    "        '1/1/all': {write: 'same/same/1', \"L/L/L\": carry} \n" +
    "        '[1/0/all, 0/1/all, 1/ /all,  /1/all]': {write: 'same/same/0', \"L/L/L\": carry} \n" +
    "        '[0/0/all, 0/ /all,  /0/all]': {write: 'same/same/1', \"L/L/L\": add}\n" +
    "        ' / /all': {write: 'same/same/1', \"S/S/S\": done}\n" +
    '    done: {}',
};

export const NonDetSubstring: ExampleTM = {
  name: 'NonDetSubstring',
  code:
    '# Contains SubString Non-Deterministic\n' +
    '#Input: First tape the input string, second tape the string we try to find in the first.\n' +
    "input: '111010/101'\n" +
    "blank: ' '\n" +
    'tapes: 2\n' +
    'startstate: goright\n' +
    'table:\n' +
    '    #Go right of start comparing\n' +
    '    goright:\n' +
    '        #Guess that this is the beginning of the substring\n' +
    "        '[1/0, 0/1, 1/1, 0/0]': \n" +
    '            - {"R/S": goright}\n' +
    '            - {"S/S": compare}\n' +
    '        \'[ /1, 1/ , 0/ ,  /0,  / ]\': {"S/S": reject}\n' +
    '    compare: \n' +
    '        \'[1/1, 0/0]\': "R/R"\n' +
    '        \'[ / , 1/ , 0/ ]\': {"S/S": accept}\n' +
    '        \'[1/0, 0/1,  /1, /0]\': {"S/S": reject} \n' +
    '    accept: {}\n' +
    '    reject: {}',
};

export const vvWord: ExampleTM = {
  name: 'vvWord',
  code:
    '# Check if string is two times one same string\n' +
    '#Input: A string w. Programm checks (non-det) if if w=vv for some string v\n' +
    "input: '010010'\n" +
    "blank: ' '\n" +
    'tapes: 2\n' +
    'startstate: gobyone\n' +
    'table:\n' +
    '    gobyone: \n' +
    '        \'all/all\': {"R/S": goright}\n' +
    '    goright:\n' +
    '        #go right or choose this location as the middle\n' +
    "        '[0/all, 1/all]': \n" +
    '            - "R/S"\n' +
    '            - {"S/S": copydown}\n' +
    '        \' /all\': {"S/S": reject}\n' +
    '    #copy the remaining string\n' +
    '    copydown:\n' +
    '        \'0/all\': {write: " /0", "R/R"} \n' +
    '        \'1/all\': {write: " /1", "R/R"}\n' +
    '        \' /all\': {"S/L": gotoendfirst}\n' +
    '    gotoendfirst: \n' +
    '        \' /all\': "L/S"\n' +
    '        \'[1/all, 0/all]\': {"S/S": gotobegin}\n' +
    '    gotobegin: \n' +
    '        \'[1/1, 0/0, 1/0, 0/1]\': "L/L"\n' +
    '        \'[1/ , 0/ ]\': "L/S"\n' +
    '        \'[ /1,  /0]\': "S/L"\n' +
    '        \' / \': {"R/R": compare}\n' +
    '    #Compare if the split creates to strings that are the same\n' +
    '    compare: \n' +
    '        \'[1/1, 0/0]\': "R/R"\n' +
    '        \' / \': {"S/S": accept}\n' +
    '        \'[1/0, 0/1,  /1,  /0, 1/ , 0/ ]\': {"S/S": reject}\n' +
    '    accept: {}\n' +
    '    reject: {}',
};

export const NonDetSubSetSum: ExampleTM = {
  name: 'NonDetSubSetSum',
  code:
    '# This Turing-Machine solves SubSetSum non-deterministically in linear time. \n' +
    '#Input: #n1#n2#n3#n4#....# on the first tape and the desired sum n on the second tape. Every number in binary\n' +
    "input: '#100#11#10#101#/1000'\n" +
    "blank: ' '\n" +
    'tapes: 3\n' +
    'startstate: choose\n' +
    'table:\n' +
    '    #Decide wether to take that number into the sum or not\n' +
    '    choose:\n' +
    '        \'#/all/all\': "R/S/S"\n' +
    "        '[1/all/all, 0/all/all]': \n" +
    '            - {"S/S/S": skip}\n' +
    '            - {"S/S/S": take}\n' +
    '        \' /all/all\': {"S/S/S": goforcompare}\n' +
    '    #Skip the number\n' +
    '    skip: \n' +
    '        \'[0/all/all, 1/all/all]\': "R/S/S"\n' +
    '        \'#/all/all\': {"R/S/S": choose}\n' +
    '    #Take the number to the sum\n' +
    '    #For this: first go right until the end of that number\n' +
    '    take: \n' +
    '        \'[1/all/all, 0/all/all]\': "R/S/S"\n' +
    '        \'#/all/all\': {"L/S/S": add}\n' +
    '        \' /all/all\': {"S/S/S": goforcompare}\n' +
    '    #Add the number to the sum\n' +
    '    add:\n' +
    '        \'[0/all/0, 0/all/1]\': "L/S/L"\n' +
    '        \'[1/all/0, 1/all/ ]\': {write: "same/same/1", "L/S/L"}\n' +
    '        \'0/all/ \': {write: "same/same/0", "L/S/L"}\n' +
    '        \'1/all/1\': {write: "same/same/0", "L/S/L": carry}\n' +
    '        \'#/all/all\': {"R/S/R": continue}  \n' +
    '    carry: \n' +
    '        \'0/all/0\': {write: "same/same/1", "L/S/L": add}\n' +
    '        \'[1/all/0, 0/all/1, 1/all/ ]\': {write: "same/same/0", "L/S/L": carry}\n' +
    '        \'[#/all/0, 0/all/ , #/all/ ]\': {write: "same/same/1", "R/S/R": continue}\n' +
    '        \'#/all/1\': {write: "same/same/0", "S/S/L": carry}\n' +
    '        \'1/all/0\': "L/S/L"\n' +
    '        \'1/all/1\': {write: "same/same/1", "L/S/L": carry}\n' +
    '    #Go completely right on the sum on tape 3 and the number we are currently looking at on tape 1\n' +
    '    continue: \n' +
    '        \'[1/all/1, 0/all/0, 1/all/0, 0/all/1]\': "R/S/R"\n' +
    '        \'[#/all/1, #/all/0]\': "S/S/R"\n' +
    '        \'[0/all/ , 1/all/ ]\': "R/S/S"\n' +
    '        \'#/all/ \': {"R/S/L": choose}\n' +
    '    #Compare if the calculated sum is the desired sum\n' +
    '    #Go left for being able to compare\n' +
    '    goforcompare:\n' +
    '        \'[all/1/1, all/0/0, all/1/0, all/0/1]\': "S/L/L"\n' +
    '        \'[all/ /1, all/ /0]\': "S/S/L"\n' +
    '        \'[all/1/ , all/0/ ]\': "S/L/S"\n' +
    '        \'all/ / \': {"S/R/R": compare}\n' +
    '    #Actually compare both numbers\n' +
    '    compare: \n' +
    '        \'[all/1/1, all/0/0]\': "S/R/R"\n' +
    '        \'all/ / \': {"S/S/S": accept}\n' +
    '        \'[all/1/0, all/1/ , all/0/1, all/0/ , all/ /1, all/ /0]\': {"S/S/S": reject}\n' +
    '    accept: {}\n' +
    '    reject: {}',
};


ExampleTMs.push(BinaryAdd);
ExampleTMs.push(NonDetSubstring);
ExampleTMs.push(vvWord);
ExampleTMs.push(NonDetSubSetSum);
ExampleTMs.push(CheckEven);
ExampleTMs.push(GCD);
ExampleTMs.push(AllStrings);
ExampleTMs.push(SelfLoops);
ExampleTMs.push(DAG);
ExampleTMs.push(Circle);