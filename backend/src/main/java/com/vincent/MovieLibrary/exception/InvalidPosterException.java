package com.vincent.MovieLibrary.exception;

public class InvalidPosterException extends RuntimeException {
    public InvalidPosterException(String message) {
        super(message);
    }
}
