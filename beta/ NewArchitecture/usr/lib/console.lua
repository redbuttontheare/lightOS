local console = {}

function console.print_info(msg)
    term.setTextColor(colors.white)
    write("[ ")
    term.setTextColor(colors.yellow)
    write("INFO")
    term.setTextColor(colors.white)
    write(" ]: ")
    print(msg)
end

function console.print_ok(msg)
    term.setTextColor(colors.white)
    write("[ ")
    term.setTextColor(colors.green)
    write("OK")
    term.setTextColor(colors.white)
    write(" ]: ")
    print(msg)
end

function console.print_error(msg)
    term.setTextColor(colors.white)
    write("[ ")
    term.setTextColor(colors.red)
    write("ERROR")
    term.setTextColor(colors.white)
    write(" ]: ")
    print(msg)
end

function console.print_red(msg)
    term.setTextColor(colors.red)
    print(msg)
    term.setTextColor(colors.white)
end

function console.print_green(msg)
    term.setTextColor(colors.green)
    print(msg)
    term.setTextColor(colors.white)
end

function console.print_yellow(msg)
    term.setTextColor(colors.yellow)
    print(msg)
    term.setTextColor(colors.white)
end

return console