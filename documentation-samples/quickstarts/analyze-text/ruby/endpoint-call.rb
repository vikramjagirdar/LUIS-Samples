require 'net/https'
require 'uri'
require 'json'

# **********************************************
# *** Update or verify the following values. ***
# **********************************************

# The ID of a public sample LUIS app that recognizes intents for turning on and off lights
appId = "df67dcdb-c37d-46af-88e1-8b97951ca1c2"

# Replace the string value with your endpoint key.
# You can use the authoring key instead of the endpoint key. 
# The authoring key allows 1000 endpoint queries a month.
endpointKey = "YOUR-KEY"

# The endpoint URI below is for the West US region.
# If you use a different region, update accordingly.
host = "https://westus.api.cognitive.microsoft.com"
path = "/luis/v2.0/apps/"

# Analyze this text
term = "turn on the left light"

if endpointKey.length != 32 then
    puts "Invalid LUIS endpoint key!"
    puts "Please paste yours into the source code."
    abort
end

qs = URI.encode_www_form(
    "q" => term, 
    "timezoneOffset" => 0, 
    "verbose" => false, 
    "spellCheck" => false, 
    "staging" => false
)
uri = URI(host + path + appId + "?" + qs)

puts
puts "LUIS query: " + term
puts
puts "Request URI: " + uri.to_s

request = Net::HTTP::Get.new(uri)
request["Ocp-Apim-Subscription-Key"] = subscriptionKey

response = Net::HTTP.start(uri.host, uri.port, :use_ssl => uri.scheme == 'https') do |http|
    http.request(request)
end

puts "\nJSON Response:\n\n"
puts JSON::pretty_generate(JSON(response.body))
