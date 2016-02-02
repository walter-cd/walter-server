#!/usr/bin/env ruby

require 'json'
require 'net/http'
require 'digest/sha1'

def pick(items)
  items[rand(items.length)]
end

now = Time.now.gmtime.to_i
start_time = now - (5 * 24 * 60 * 60)

history_count = 20
time_delta = (now - start_time)/(history_count + 1)

define_method(:generate_report) do |running|
  out_example_1 = '12:24:00  INFO Pipeline file path: "./pipeline.yml"\n' +
                  '12:24:00  WARN failed to read the configuration file\n' +
                  '12:24:00  INFO kettle places on heating element\n' +
                  '12:24:00  INFO a bit of steam visible\n' +
                  '12:24:00  WARN getting a little hot now\n' +
                  '12:24:00  WARN loud whistling sounds\n' +
                  '12:24:00 ERROR open ./pipeline.yml: no such file or directory\n' +
                  '12:24:00 ERROR failed to create Walter\n' ;
  out_example_2 = '12:24:00  INFO this info message is to test the INFO message level"\n' ;

  template = {
    'Project' => {
      'Name' => 'walter-cd/walter-server',
      'Repo' => 'github.com/walter-cd/walter-server',
    },
    'Status' => 'Passed',
    'Start' => 1449062903,
    'End' => 1449062940,
    'Branch' => 'master',
    'Commits' => [
      # {Revision: "203", Author: "gerryhocks", Message: "Some changes"},
    ],
    'Stages' => [
      {
        'Name' => 'command_stage_1',
        'Status' => 'Passed',
        'Start' => 1449062903,
        'End' => 1449062920,
        'Log' => out_example_1,
        'Stage' => []
      },
      {
        'Name' => 'build_thing',
        'Status' => 'Passed',
        'Start' => 1449062903,
        'End' => 1449062940,
        'Log' => out_example_2,
        'Stages' => [
          {
            'Name' => 'build_thing_substage_1',
            'Status' => 'Passed',
            'Start' => 1449062903,
            'End' => 1449062923,
            'Log' => '',
            'Stages' => []
          }
        ]
      },
      {
        'Name' => 'package_product',
        'Status' => 'Passed',
        'Start' => 1449062903,
        'End' => 1449062920,
        'Log' => '',
        'Stages' => []
      },
    ],
    'CompareUrl' => 'http://compare.url/',
    'TriggeredBy' => {
      'Name' => 'gerryhocks',
      'Url' => 'http://someplace.com/',
      'AvatarUrl' => ''
    }
  };
  
  (0 .. rand(3) + 1).each do |i|
    template['Commits'].push(
      {
        'Revision' => Digest::SHA1.hexdigest(rand.to_s)[0, 6],
        'Author' => pick(%w(mizzy takahi-i cmoen gerryhocks)),
        'Message' => pick(['Some changes', 'Fixing previous errors', 'A new feature', 'Updated documentation'])
      }
    )
    template['TriggeredBy']['Name'] = pick(%w(mizzy takahi-i cmoen gerryhocks))
  end

  passed = rand > 0.45

  duration1 = (rand * 900).to_i
  duration2 = (rand * 800).to_i

  template['Project']['Name'] = pick(%w(walter-cd/walter-server walter-cd/walter redpen-cc/redpen))

  template['Project']['Repo'] = 'https://github.com/' + template['Project']['Name']
  
  template['Branch'] = pick(%w(master next-gen alpha))

  avatar_url = {
    'mizzy' => 'https://avatars0.githubusercontent.com/u/3620?v=3&s=460',
    'takahi-i' => 'https://avatars2.githubusercontent.com/u/339436?v=3&s=460',
    'cmoen' => 'https://avatars1.githubusercontent.com/u/572153?v=3&s=460',
    'gerryhocks' => 'https://avatars3.githubusercontent.com/u/1311758?v=3&s=460',
  }

  template['TriggeredBy']['AvatarUrl'] = avatar_url[template['TriggeredBy']['Name']]

  template['TriggeredBy']['Url'] = 'https://github.com/' + template['TriggeredBy']['Name']
  
  template['Status'] = running ? 'Running' : ( passed ? 'Passed' : 'Failed' )

  template['Start'] = start_time
  template['End'] = running ? now : start_time + duration1 + duration2

  template['Stages'][0]['Start'] = start_time
  template['Stages'][0]['End'] = start_time + duration1
  template['Stages'][1]['Start'] = template['Stages'][0]['End']
  template['Stages'][1]['End'] = running ? 0 : template['End']
  template['Stages'][1]['Status'] = running ? 'Running' : ( passed ? 'Passed' : 'Failed' )
  template['Stages'][2]['Start'] = 0;
  template['Stages'][2]['End'] = 0;
  template['Stages'][2]['Status'] = 'Pending'
  template['Stages'][1]['Stages'][0]['Start'] = template['Stages'][1]['Start']
  template['Stages'][1]['Stages'][0]['End'] = running ? 0 : template['Stages'][1]['End']
  template['Stages'][1]['Stages'][0]['Status'] = running ? 'Running' : ( passed ? 'Passed' : 'Failed' )

  start_time += (time_delta + rand * 900).to_i

  template
end


req = Net::HTTP::Post.new(
  '/api/v1/reports',
  initheader = {'Content-Type' =>'application/json'},
)

(0 .. 20).each do
  req.body = generate_report(false).to_json
  res = Net::HTTP.new('localhost', '8080').start {|h| h.request(req)}
end

req.body = generate_report(true).to_json
res = Net::HTTP.new('localhost', '8080').start {|h| h.request(req)}

