package com.vincent.MovieLibrary.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class RegistrationRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void validRequestAndBoundaryLengthsHaveNoViolations() {
        assertThat(validator.validate(new RegistrationRequest("abc", "x"))).isEmpty();
        assertThat(validator.validate(new RegistrationRequest("u".repeat(50), "p".repeat(10_000)))).isEmpty();
        assertThat(validator.validate(new RegistrationRequest("User.name_2-test", "correct-horse"))).isEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidRequests")
    void invalidRequestProducesExpectedViolation(
            String description,
            RegistrationRequest request,
            String field,
            String message
    ) {
        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(request);

        assertThat(violations).anySatisfy(violation -> {
            assertThat(violation.getPropertyPath().toString()).isEqualTo(field);
            assertThat(violation.getMessage()).isEqualTo(message);
        });
    }

    private static Stream<Arguments> invalidRequests() {
        return Stream.of(
                Arguments.of("null username", new RegistrationRequest(null, "12345678"),
                        "username", "Username is required"),
                Arguments.of("blank username", new RegistrationRequest("   ", "12345678"),
                        "username", "Username is required"),
                Arguments.of("short username", new RegistrationRequest("ab", "12345678"),
                        "username", "Username must be between 3 and 50 characters"),
                Arguments.of("long username", new RegistrationRequest("u".repeat(51), "12345678"),
                        "username", "Username must be between 3 and 50 characters"),
                Arguments.of("invalid username", new RegistrationRequest("bad user!", "12345678"),
                        "username", "Username may only contain letters, numbers, dots, underscores, and hyphens"),
                Arguments.of("null passcode", new RegistrationRequest("person", null),
                        "passcode", "Passcode is required"),
                Arguments.of("blank passcode", new RegistrationRequest("person", "   "),
                        "passcode", "Passcode is required")
        );
    }
}
