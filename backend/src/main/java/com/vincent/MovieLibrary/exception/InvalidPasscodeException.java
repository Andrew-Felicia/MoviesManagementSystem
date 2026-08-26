package com.vincent.MovieLibrary.exception;

public class InvalidPasscodeException extends RuntimeException {

    public InvalidPasscodeException(String message) {
        super(message);
    }
}
