# frozen_string_literal: true

=begin
Allows to use the following in templates:

{% graphviz some title %}
digraph G {
  node [shape=box]
  edge [color = "#aaaaaa"]
  overlap = "false"
  nodesep = 1

  sda2 [label="sda2", color="#ffd44f"]
  sdb2 [label="sdb2", color="#ffd44f"]

  md1 [label="mdraid mirror (md1)", color="#ffd44f"]

  sda2, sdb2 -> md1
}
{% endgraphviz %}

Which will generate the graph using `dot` command,
and output the result as `img` tag with proper title.

Alternatively, you can leave out the title out,
in which case it will be set to `inlined graphviz graph`.

And if you use `graphviz_captioned` block instead of `graphviz`,
the title will also end up as a caption below the image.
=end

require "jekyll"
require 'open3'
require 'cgi'
require 'base64'
require 'shellwords'

$LOAD_PATH.unshift(File.dirname(__FILE__))

module Jekyll
  class RenderGraphvizBlock < Liquid::Block
    def initialize(tag_name, text, tokens)
      super
      @caption = !!(tag_name =~ /captioned/)
      @title = text && text.strip
      @title = nil if @title && @title.empty?
    end

    DEFAULT_COMMAND = "dot"
    DEFAULT_OPTIONS = ["-Tsvg"].freeze

    # Reads `graphviz.command` / `graphviz.options` from _config.yml.
    # The command is a single executable name or path; options may be a
    # string (split shell-style, never passed through a shell) or a list.
    def graphviz_argv(context)
      site = context.registers[:site]
      conf = site && site.config["graphviz"]
      conf = {} unless conf.is_a?(Hash)

      command = conf["command"].to_s.strip
      command = DEFAULT_COMMAND if command.empty?

      options =
        case conf["options"]
        when Array then conf["options"].map(&:to_s)
        when nil then DEFAULT_OPTIONS
        else Shellwords.split(conf["options"].to_s)
        end
      options = DEFAULT_OPTIONS if options.empty?

      [command, *options]
    rescue ArgumentError => e
      # unbalanced quotes in `graphviz.options`
      Jekyll.logger.warn "graphviz:", "invalid graphviz.options (#{e.message}); using #{DEFAULT_OPTIONS.join(' ')}"
      [command || DEFAULT_COMMAND, *DEFAULT_OPTIONS]
    end

    def gen_svg(input, argv)
      # [cmd, argv0] form plus separate arguments: Ruby never invokes a shell,
      # even if the configured command contains spaces or metacharacters
      command, *args = argv
      output, status = Open3.capture2e([command, command], *args, stdin_data: input, binmode: true)
      output.force_encoding 'UTF-8'
      if status.success?
        [output, nil]
      else
        [nil, output]
      end
    rescue SystemCallError => e
      # the command is not installed or not executable; show the error instead of aborting the build
      [nil, "graphviz: could not run `#{argv.first}`: #{e.message}"]
    end

    def render(context)
      text = super
      output, error = gen_svg(text.strip, graphviz_argv(context))
      if error
        "<pre><code>" + CGI.escapeHTML(error) + "</code></pre>"
      else
        title = @title || "inlined graphviz graph"
        b64 = Base64.strict_encode64(output)
        out = []
        out << "<p>"
        out << "<img alt=\"#{CGI.escapeHTML(title)}\" "
        out << "src=\"data:image/svg+xml;base64,#{b64}\" />"
        if @caption
          out << "\n<em>#{CGI.escapeHTML(title)}</em>"
        end
        out << "</p>"
        out.join
      end
    end
  end
end

Liquid::Template.register_tag('graphviz', Jekyll::RenderGraphvizBlock)
Liquid::Template.register_tag('graphviz_captioned', Jekyll::RenderGraphvizBlock)